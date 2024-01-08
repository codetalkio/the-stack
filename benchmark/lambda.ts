import {
  GetFunctionConfigurationCommand,
  GetFunctionUrlConfigCommand,
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommandInput,
} from '@aws-sdk/client-lambda';
import {
  BatchGetTracesCommand,
  BatchGetTracesCommandInput,
  GetTraceSummariesCommand,
  GetTraceSummariesCommandInput,
  Trace,
  TraceSummary,
  XRayClient,
} from '@aws-sdk/client-xray';
import * as fs from 'fs';

import benchmarkPayloadNoQuery from './payload-no-query.json';
import benchmarkPayloadProducts from './payload-products.json';

// const chartistSvg = require('svg-chartist');

/**
 * Benchmark configuration values.
 */
const COLD_STARTS = 10;
const WARM_STARTS = 10;
// const MEMORY_SIZES = [128, 256, 512, 1024, 2048] as const;
const MEMORY_SIZES = [512, 1024, 2048] as const;

// How long to wait for XRay to gather all the traces.
const WAIT_FOR_XRAY = 15;

const RUN_ID = process.env.RUN_ID ?? `${new Date().toISOString()}`;
const DRY_RUN = process.env.DRY_RUN;

// We allow you to pass multiple function names split by comma.
const FN_NAMES: string[] = process.env.FUNCTION_NAME?.includes(',')
  ? process.env.FUNCTION_NAME?.split(',') ?? []
  : [process.env.FUNCTION_NAME!];
const benchmarkPayload =
  process.env.BENCHMARK_PAYLOAD === 'products' ? benchmarkPayloadProducts : benchmarkPayloadNoQuery;

// Track summary of each function run.
let RUN_SUMMARY_STRUCTURE = {
  header: `| Measurement (ms) |`,
  sep: '|-------------|',
  avgWarm: '| Average warm start response time |',
  avgCold: '| Average cold start response time |',
  fastestWarm: '| Fastest warm response time |',
  slowestWarm: '| Slowest warm response time |',
  fastestCold: '| Fastest cold response time  |',
  slowestCold: '| Slowest cold response time |',
};

let RUN_SUMMARY = {
  ...RUN_SUMMARY_STRUCTURE,
};

/**
 * Map of memory configuration and their benchmark results.
 */
interface MemoryTimes {
  memorySize: number;
  times: BenchmarkResults;
}

/**
 * The benchmark numbers.
 */
interface BenchmarkResults {
  overallTimes: BenchmarkAggregateMetrics;
  traceTimes: BenchmarkSingleInvocationMetric[];
}

/**
 * All aggregate benchmark metrics.
 */
interface BenchmarkAggregateMetrics {
  avgWarmMs: number | undefined;
  avgColdMs: number | undefined;
  fastestWarmMs: number | undefined;
  fastestColdMs: number | undefined;
  slowestWarmMs: number | undefined;
  slowestColdMs: number | undefined;
}

/**
 * The metrics for a single invocation, extract from XRay.
 */
interface BenchmarkSingleInvocationMetric {
  id: string | undefined;
  totalTime: number | undefined;
  initTime: number | undefined;
  invocTime: number | undefined;
  overheadTime: number | undefined;
}

/**
 * Map of memory configuration and the traces extracted.
 */
interface MemoryTraces {
  memorySize: number;
  traces: MinimalTrace[];
}

/**
 * The minimal trace information we require for processing.
 */
type MinimalTrace = Pick<Trace, 'Id'> & { Segments: SegmentDocument[] };

/**
 * The layout of the XRay segments.
 */
interface SegmentDocument {
  origin?: string;
  end_time: number;
  start_time: number;
  subsegments?: SubSegment[];
}

/**
 * The layout of the XRay sub-segments.
 */
interface SubSegment {
  name?: string;
  end_time: number;
  start_time: number;
}

/**
 * Run the benchmark by:
 * - Iterating through memory configurations.
 * - Updating the Lambda with each memory configuration.
 * - Invoking the Lambda for n cold starts and m warm starts.
 * - Extract all XRay traces.
 * - Process the traces to get the benchmark results.
 * - Output a markdown table and two charts.
 *
 * If you just want to reprocess the results, run the benchmark with `DRY_RUN`,
 * e.g. `DRY_RUN=true bun run benchmark`. This will skip deployment, teardown, invocations, and
 * fetching of XRay traces, and instead load the existing traces from `traces.json` and generate
 * the output again.
 */
const main = async (functionName: string): Promise<typeof RUN_SUMMARY_STRUCTURE> => {
  const memoryTimes: MemoryTimes[] = [];
  if (DRY_RUN === 'true') {
    // If we are running a dry run, we only need to load in the existing traces and process them.
    const memoryTraces = JSON.parse(fs.readFileSync(`./traces/${functionName}-${RUN_ID}-traces.json`).toString());
    memoryTraces.forEach(({ memorySize, traces: traceBatches }: MemoryTraces) => {
      const times = processXRayTraces(functionName, traceBatches);
      memoryTimes.push({
        memorySize,
        times,
      });
    });
  } else {
    // For each memory configuration, run through all invocations first.
    console.log(`[MAIN][${functionName}] Initiating benchmarking.`);
    const benchmarkStartTimes: Date[] = [];
    for (let i = 0; i < MEMORY_SIZES.length; i++) {
      const benchmarkStartTime = new Date();
      benchmarkStartTimes.push(benchmarkStartTime);
      const memorySize = MEMORY_SIZES[i];
      await invokeFunctions(functionName, memorySize);
      await sleep(1000);
    }

    console.log(`[MAIN][${functionName}] Gathering XRay traces.`);
    // The XRay traces should now be ready for us to fetch.
    const memoryTraces: MemoryTraces[] = [];
    for (let i = 0; i < MEMORY_SIZES.length; i++) {
      const benchmarkStartTime = benchmarkStartTimes[i];
      const memorySize = MEMORY_SIZES[i];
      // Wait to let XRay gather all the traces.
      await Bun.sleep(WAIT_FOR_XRAY * 1000);
      console.log(`[MAIN][${functionName}] Fetching trace summaries.`);
      const traceSummaries = await fetchXRayTraceSummaries(functionName, benchmarkStartTime);
      console.log(`[MAIN][${functionName}] Fetching trace batches.`);
      const traceBatches = await fetchXRayTraceBatches(functionName, traceSummaries);
      memoryTraces.push({
        memorySize,
        traces: traceBatches,
      });
      const times = processXRayTraces(functionName, traceBatches);
      memoryTimes.push({
        memorySize,
        times,
      });
    }
    console.log(`[MAIN][${functionName}] Writing traces to file.`);
    fs.writeFileSync(`./traces/${functionName}-${RUN_ID}-traces.json`, JSON.stringify(memoryTraces));
  }

  console.log(`[MAIN][${functionName}] Summarizing output to markdown.`);
  const summary = outputBenchmarkMarkdown(functionName, memoryTimes);
  // outputBenchmarkChart(functionName, memoryTimes);
  return summary;
};

/**
 * Sleep for the specified time.
 */
const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Run the actual benchmark, performing a series of invocations to the Lambda. To ensure cold
 * starts, we trigger an update on the functions environment variables before invoking it. We
 * then invoke it a number of times afterwards to gather warm startup data as well.
 *
 * The `memorySize` configuration sets the Lambda memory size, allowing easy scale up and down.
 */
const invokeFunctions = async (functionName: string, memorySize: number) => {
  const lambdaClient = new LambdaClient({});
  const baseConfiguration = await lambdaClient.send(
    new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    }),
  );
  const fnUrlConfig = await lambdaClient.send(
    new GetFunctionUrlConfigCommand({
      FunctionName: functionName,
    }),
  );

  // We generate the update configuration on the fly to always provide a unique
  // benchmark run time.
  const updateConfiguration: () => UpdateFunctionConfigurationCommandInput = () => ({
    FunctionName: functionName,
    MemorySize: memorySize,
    Environment: {
      Variables: {
        ...baseConfiguration.Environment?.Variables,
        BENCHMARK_RUN_TIME: `${new Date().toISOString()}-${Math.random()}`,
      },
    },
  });
  const mkPayload: () => string = () => {
    // Dynamically replace placeholders in the payload, so we can generate unique
    // test data per invocation.
    return JSON.stringify(benchmarkPayload)
      .replace('##DATE##', new Date().toISOString())
      .replace('##NUM##', `${Math.floor(Math.random() * 10000)}`);
  };

  for (let cI = 0; cI < COLD_STARTS; cI++) {
    console.log(`[BENCHMARK][${functionName}] Updating the function to ensure a cold start.`);
    try {
      await lambdaClient.send(new UpdateFunctionConfigurationCommand(updateConfiguration()));
    } catch (err: any) {
      if (err.name !== 'ResourceConflictException') {
        throw err;
      } else {
        await sleep(1500);
        try {
          await lambdaClient.send(new UpdateFunctionConfigurationCommand(updateConfiguration()));
        } catch (err: any) {
          if (err.name !== 'ResourceConflictException') {
            throw err;
          } else {
            console.error(`[BENCHMARK][${functionName}] Failed to update the function, giving up.`);
          }
        }
      }
    }
    const s = Date.now();

    // Lambda invoke version:
    // const res = await lambdaClient.send(new InvokeCommand(testPayload()));
    // const payload = res.Payload?.transformToString();
    // const statusCode = res.StatusCode;

    // HTTP invoke version:
    const res = await fetch(fnUrlConfig.FunctionUrl!, {
      method: 'POST',
      body: mkPayload(),
      headers: { 'Content-Type': 'application/json' },
    });
    const payload = await res.json();
    const statusCode = res.status;

    if (statusCode !== 200 || payload.error || payload.errorMessage || payload.errorType || !payload.data) {
      console.error(statusCode, payload);
    }
    console.log(
      `[BENCHMARK][${functionName}] Invoked cold-start function: ${Date.now() - s}ms. (status ${statusCode})`,
    );
    await sleep(500);
  }
  for (let wI = 0; wI < WARM_STARTS; wI++) {
    const s = Date.now();
    // Lambda invoke version:
    // const res = await lambdaClient.send(new InvokeCommand(testPayload()));
    // const payload = res.Payload?.transformToString();
    // const statusCode = res.StatusCode;

    // HTTP invoke version:
    const res = await fetch(fnUrlConfig.FunctionUrl!, {
      method: 'POST',
      body: mkPayload(),
      headers: { 'Content-Type': 'application/json' },
    });
    const payload = await res.json();
    const statusCode = res.status;

    if (statusCode !== 200 || payload.error || payload.errorMessage || payload.errorType || !payload.data) {
      console.error(statusCode, payload);
    }
    console.log(
      `[BENCHMARK][${functionName}] Invoked warm-start function: ${Date.now() - s}ms. (status ${statusCode})`,
    );
    await sleep(500);
  }
};

/**
 * Fetch all XRay trace summaries, which contain the trace IDs we will need to get the detailed information. We
 * limit the information we search for by filtering on the `functionName` and on service type of AWS:Lambda. Additionally,
 * we only look in the period between the `benchmarkStartTime` time and the time that this function is called.
 *
 * Since XRay trace can take some time to appear, we also gracefully handle waiting if we don't see at least 90% of
 * the traces in the results.
 */
const fetchXRayTraceSummaries = async (functionName: string, benchmarkStartTime: Date): Promise<TraceSummary[]> => {
  const benchmarkEndTime = new Date();
  const xRayClient = new XRayClient({});

  const traceSummaries: TraceSummary[] = [];
  let nextTokenSummary: string | undefined;
  let retries = 0;
  let retry = true;
  while (retry) {
    const traceInput: GetTraceSummariesCommandInput = {
      StartTime: benchmarkStartTime,
      EndTime: benchmarkEndTime,
      FilterExpression: `service(id(name: "${functionName}", type: "AWS::Lambda"))`,
      NextToken: nextTokenSummary,
    };
    const traceSummariesRes = await xRayClient.send(new GetTraceSummariesCommand(traceInput));
    nextTokenSummary = traceSummariesRes.NextToken;
    traceSummaries.push(...(traceSummariesRes.TraceSummaries ?? []));

    // Make sure we've fetched all our traces. We only require 90% to have been gathered, since
    // XRay is sampling our requests.
    if ((traceSummariesRes.TraceSummaries?.length ?? 0) + traceSummaries.length < (COLD_STARTS + WARM_STARTS) * 0.8) {
      if (retries >= 40) {
        throw new Error(
          `[TEARDOWN][${functionName}] Failed to get all traces for the invocations, was only able to find '${traceSummariesRes.TraceSummaries?.length}' traces.`,
        );
      }
      console.log(`[TRACES][${functionName}] Traces has still not appeared, waiting 1 seconds and trying again...`);
      await sleep(1000);
      retries++;
    } else {
      retry = false;
    }

    if (!retry && nextTokenSummary === undefined) {
      break;
    }
  }
  console.log(`[TRACES][${functionName}] Fetched trace summaries, fetching detailed trace information.`);
  return traceSummaries;
};

/**
 * Split an array into chunks based on the `size`.
 */
const chunkArray = (arr: any[], size: number) => {
  var results: any[] = [];
  while (arr.length) {
    results.push(arr.splice(0, size));
  }
  return results;
};

/**
 * Once we have a list of trace IDs, we can get the detailed trace information which contain the breakdown
 * of the different stages the Lambda function went through.
 *
 * Because the XRay API is limited to fetching 5 traces at a time, we divide all the trace IDs into chunks of
 * 5. Additionally, we re-request traces if we detect any that are unprocessed.
 *
 * NOTE: To avoid leaking information, all traces are stripped of information and only a whitelist is saved.
 */
const fetchXRayTraceBatches = async (
  functionName: string,
  traceSummaries: Pick<TraceSummary, 'Id'>[],
): Promise<MinimalTrace[]> => {
  const xRayClient = new XRayClient({});
  const batchTraces: MinimalTrace[] = [];

  // We can only request 5 traces at a time, so we split the summary IDs into chunks.
  const batchSummaryChunks = chunkArray(traceSummaries, 5);

  let nextTokenBatch: string | undefined;
  for (let i = 0; i < batchSummaryChunks.length; i++) {
    const batchSummaryChunk = batchSummaryChunks[i];
    while (true) {
      const batchInput: BatchGetTracesCommandInput = {
        TraceIds: [...new Set<any>(batchSummaryChunk.filter((t) => t.Id).map((t) => t.Id!))],
        NextToken: nextTokenBatch,
      };
      const batchTracesRes = await xRayClient.send(new BatchGetTracesCommand(batchInput));

      // Check if there are any unprocessed traces. If there are, we wait 1 second and retry the loop.
      if ((batchTracesRes.UnprocessedTraceIds?.length ?? 0) > 0) {
        console.log(
          `[TRACES][${functionName}] Detailed traces are still being processed, waiting 1 second and trying again...`,
        );
        await sleep(1000);
        continue;
      }

      // Only store the relevant parts of the traces, so we can't accidentally leak information.
      const minimalTraces: MinimalTrace[] = (batchTracesRes.Traces ?? []).map((t) => ({
        Id: t.Id,
        Segments: (t.Segments ?? [])
          .filter((s) => s.Document !== undefined)
          .map((s: any) => {
            const seg: SegmentDocument = JSON.parse(s.Document!);
            const cleanedSeg: SegmentDocument = {
              origin: seg.origin,
              end_time: seg.end_time,
              start_time: seg.start_time,
              subsegments: seg.subsegments?.map((subSeg) => ({
                name: subSeg.name,
                end_time: subSeg.end_time,
                start_time: subSeg.start_time,
              })),
            };
            return cleanedSeg;
          }),
      }));
      batchTraces.push(...minimalTraces);

      nextTokenBatch = batchTracesRes.NextToken;
      if (nextTokenBatch === undefined) {
        break;
      }
    }
  }

  return batchTraces;
};

/**
 * Process a list of XRay detailed traces, extracting the timings for the various
 * segments, along with overall metrics.
 */
const processXRayTraces = (functionName: string, traces: MinimalTrace[]): BenchmarkResults => {
  console.log(`[TRACES][${functionName}] Processing trace information.`);
  // Gather overall metrics.
  let avgWarmMs: number | undefined;
  let avgColdMs: number | undefined;
  let fastestWarmMs: number | undefined;
  let fastestColdMs: number | undefined;
  let slowestWarmMs: number | undefined;
  let slowestColdMs: number | undefined;

  // Gather per-trace metrics.
  const traceTimes: BenchmarkSingleInvocationMetric[] = [];
  traces.map((trace) => {
    let totalTime: number | undefined;
    let initTime: number | undefined;
    let invocTime: number | undefined;
    let overheadTime: number | undefined;

    // Piece together the segment timings into one measurement.
    trace.Segments?.map((seg) => {
      if (seg.origin === 'AWS::Lambda') {
        totalTime = seg.end_time - seg.start_time;
      } else if (seg.origin === 'AWS::Lambda::Function') {
        seg.subsegments?.map((subSeg) => {
          if (subSeg.name === 'Initialization') {
            initTime = subSeg.end_time - subSeg.start_time;
          } else if (subSeg.name === 'Invocation') {
            invocTime = subSeg.end_time - subSeg.start_time;
          } else if (subSeg.name === 'Overhead') {
            overheadTime = subSeg.end_time - subSeg.start_time;
          }
        });
      }
    });

    const isColdStart = initTime ? true : false;

    // XRay validation (see https://github.com/codetalkio/patterns-serverless-rust-minimal/issues/5 for context):
    // 1. XRay can sometimes hand us back invalid traces where the total time is less than the
    // sum of its elements. We discard these traces.
    const otherTime = (initTime || 0) + (invocTime || 0) + (overheadTime || 0);
    if (totalTime! < otherTime) {
      console.error(
        `[TRACES][${functionName}] Invalid trace with total time '${totalTime}' less than sum of other times '${otherTime}'. ID = ${trace.Id}.`,
      );
      return;
    }
    // 2. Similarly, XRay sometimes only catches the Lambda service part, but not the function metrics
    // themselves. We are then unable to tell if it was a cold start or not.
    if (!invocTime) {
      console.error(`[TRACES][${functionName}] Invalid trace with missing invocation time. ID = ${trace.Id}.`);
      return;
    }

    traceTimes.push({
      id: trace.Id,
      totalTime,
      initTime,
      invocTime,
      overheadTime,
    });

    // Keep track of overall metrics.
    if (!isColdStart) {
      avgWarmMs = !avgWarmMs ? totalTime : (avgWarmMs + totalTime!) / 2;
      fastestWarmMs = !fastestWarmMs || totalTime! < fastestWarmMs ? totalTime : fastestWarmMs;
      slowestWarmMs = !slowestWarmMs || totalTime! > slowestWarmMs ? totalTime : slowestWarmMs;
    } else if (isColdStart) {
      avgColdMs = !avgColdMs ? totalTime : (avgColdMs + totalTime!) / 2;
      fastestColdMs = !fastestColdMs || totalTime! < fastestColdMs ? totalTime : fastestColdMs;
      slowestColdMs = !slowestColdMs || totalTime! > slowestColdMs ? totalTime : slowestColdMs;
    }
  });

  return {
    overallTimes: {
      avgWarmMs,
      avgColdMs,
      fastestWarmMs,
      slowestWarmMs,
      fastestColdMs,
      slowestColdMs,
    },
    traceTimes,
  };
};

/**
 * Output the results to the `response-times.md` markdown file by manually piecing together the
 * markdown content.
 */
const outputBenchmarkMarkdown = async (
  functionName: string,
  memoryTimes: MemoryTimes[],
): Promise<typeof RUN_SUMMARY_STRUCTURE> => {
  console.log(`[OUTPUT][${functionName}] Saving benchmark times to 'response-times.md'.`);
  let summary = {
    header: '',
    sep: '',
    avgWarm: '',
    avgCold: '',
    fastestWarm: '',
    slowestWarm: '',
    fastestCold: '',
    slowestCold: '',
  };
  // Generate the measurement tables for each memory configuration section.
  let overviewData = `

## Summary of Results`;
  let overviewTableData = {
    ...RUN_SUMMARY_STRUCTURE,
  };

  let benchmarkData = '';
  memoryTimes.map(({ memorySize, times }) => {
    benchmarkData += `

## Results for ${memorySize} MB`;
    const results = `

| Measurement (${memorySize} MB) | Time (ms) |
|-------------|------|
| Average warm start response time | ${Math.floor(times.overallTimes.avgWarmMs! * 10000) / 10} ms |
| Average cold start response time | ${Math.floor(times.overallTimes.avgColdMs! * 10000) / 10} ms |
| Fastest warm response time | ${Math.floor(times.overallTimes.fastestWarmMs! * 10000) / 10} ms |
| Slowest warm response time | ${Math.floor(times.overallTimes.slowestWarmMs! * 10000) / 10} ms |
| Fastest cold response time  | ${Math.floor(times.overallTimes.fastestColdMs! * 10000) / 10} ms |
| Slowest cold response time | ${Math.floor(times.overallTimes.slowestColdMs! * 10000) / 10} ms |
  `;

    benchmarkData += results;
    const header = ` ${functionName} (${memorySize} MB) |`;
    const sep = '-------------|';
    const avgWarm = ` ${Math.floor(times.overallTimes.avgWarmMs! * 10000) / 10} ms |`;
    const avgCold = ` ${Math.floor(times.overallTimes.avgColdMs! * 10000) / 10} ms |`;
    const fastestWarm = ` ${Math.floor(times.overallTimes.fastestWarmMs! * 10000) / 10} ms |`;
    const slowestWarm = ` ${Math.floor(times.overallTimes.slowestWarmMs! * 10000) / 10} ms |`;
    const fastestCold = ` ${Math.floor(times.overallTimes.fastestColdMs! * 10000) / 10} ms |`;
    const slowestCold = ` ${Math.floor(times.overallTimes.slowestColdMs! * 10000) / 10} ms |`;

    summary.header += header;
    summary.sep += sep;
    summary.avgWarm += avgWarm;
    summary.avgCold += avgCold;
    summary.fastestWarm += fastestWarm;
    summary.slowestWarm += slowestWarm;
    summary.fastestCold += fastestCold;
    summary.slowestCold += slowestCold;

    overviewTableData.header += header;
    overviewTableData.sep += sep;
    overviewTableData.avgWarm += avgWarm;
    overviewTableData.avgCold += avgCold;
    overviewTableData.fastestWarm += fastestWarm;
    overviewTableData.slowestWarm += slowestWarm;
    overviewTableData.fastestCold += fastestCold;
    overviewTableData.slowestCold += slowestCold;

    benchmarkData += `

| Response time | Initialization | Invocation | Overhead | Cold/ Warm Start | Memory Size | Trace ID |
|---------------|----------------|------------|----------|------------------|-------------|----------|`;
    times.traceTimes.map((time) => {
      const isColdStart = !!time.initTime;
      const totalTimeMs = time.totalTime ? `${Math.floor(time.totalTime * 10000) / 10} ms` : '';
      const initTimeMs = time.initTime ? `${Math.floor(time.initTime * 10000) / 10} ms` : '';
      const invocTimeMs = time.invocTime ? `${Math.floor(time.invocTime * 10000) / 10} ms` : '';
      const overheadTimeMs = time.overheadTime ? `${Math.floor(time.overheadTime * 10000) / 10} ms` : '';
      const coldOrWarmStart = isColdStart ? '🥶' : '🥵';
      benchmarkData += `
| ${totalTimeMs} | ${initTimeMs} | ${invocTimeMs} | ${overheadTimeMs} | ${coldOrWarmStart} | ${memorySize} MB | ${time.id} |`;
    });
  });

  const overviewTable = `
${overviewTableData.header}
${overviewTableData.sep}
${overviewTableData.avgWarm}
${overviewTableData.avgCold}
${overviewTableData.fastestWarm}
${overviewTableData.slowestWarm}
${overviewTableData.fastestCold}
${overviewTableData.slowestCold}
  `;

  // Set up the page, including the generated charts.
  const header = `
# Benchmark: Response Times

The following are the response time results from AWS XRay, generated after running \`bun run benchmark\`.

- Run ID: ${RUN_ID}
- Function Name: ${functionName}
- Payload: ${benchmarkPayload === benchmarkPayloadProducts ? 'Products' : 'No Query'}

![Average Cold/Warm Response Times](./${functionName}-${RUN_ID}-response-times-average.svg)

- 🔵: Average cold startup times
- 🔴: Average warm startup times

![Fastest and Slowest Response Times](./${functionName}-${RUN_ID}-response-times-extremes.svg)

- 🔵: Fastest warm response time
- 🔴: Slowest warm response time
- 🟡: Fastest cold response time
- 🟠: Slowest cold response time

`;

  // Provide a table of contents for quick access to the different measurements.
  let tableOfContents = `
## Overview

  `;
  memoryTimes.map(({ memorySize }) => {
    tableOfContents += `
- [Results for ${memorySize} MB](#results-for-${memorySize}-mb)`;
  });

  // Include generic XRay trace examples in the bottom of the page.
  const footer = `

## XRay Example of a Cold Start

<img width="1476" alt="Screenshot 2020-10-07 at 23 01 40" src="https://user-images.githubusercontent.com/1189998/95387505-178a1d00-08f1-11eb-83a7-7bc32eee48e2.png">

## XRay Example of a Warm Start

<img width="1479" alt="Screenshot 2020-10-07 at 23 01 23" src="https://user-images.githubusercontent.com/1189998/95387509-1953e080-08f1-11eb-8d46-ac25efa235e4.png">
`;
  const markdown = [header, tableOfContents, overviewData, overviewTable, benchmarkData, footer].join('\n');
  fs.writeFileSync(`./traces/${functionName}-${RUN_ID}-response-times.md`, markdown);

  return summary;
};

/**
 * Output two charts based on the data, showing the behaviour and performance of the AWS Lambda:
 * - response-times-average.svg: Shows average cold start and warm starts, for each memory configuration.
 * - response-times-extremes.svg: Shows the fastest and slowests response times for both cold and warm
 *   starts, for each memory configuration.
 */
// const outputBenchmarkChart = async (functionName: string, memoryTimes: MemoryTimes[]) => {
//   console.log(
//     `[OUTPUT][${functionName}] Charting benchmark times to './traces/${functionName}-${RUN_ID}-response-times.svg'.`,
//   );

//   const opts = {
//     options: {
//       width: 700,
//       height: 300,
//       axisX: {
//         showLabel: true,
//         showGrid: false,
//       },
//       axisY: {
//         labelInterpolationFnc: function (value: any) {
//           return value + 'ms';
//         },
//         scaleMinSpace: 15,
//       },
//     },
//     title: {
//       height: 50,
//       fill: '#4A5572',
//     },
//     css: `.ct-series-a .ct-bar, .ct-series-a .ct-line, .ct-series-a .ct-point, .ct-series-a .ct-slice-donut{
//       stroke: #4A5572
//     }`,
//   };

//   const labels: string[] = [];
//   const avgSeries: number[][] = [
//     [], // Avg. Cold
//     [], // Avg. Warm
//   ];
//   const extremesSeries: number[][] = [
//     [], // Fastest Warm
//     [], // Slowest Warm
//     [], // Fastest Cold
//     [], // Slowest Cold
//   ];
//   memoryTimes.map(({ memorySize, times }) => {
//     labels.push(`${memorySize}MB`);
//     // Add the average data to the first chart series.
//     avgSeries[0].push(Math.floor(times.overallTimes.avgColdMs! * 10000) / 10);
//     avgSeries[1].push(Math.floor(times.overallTimes.avgWarmMs! * 10000) / 10);
//     // Add the extremes data to the second chart series.
//     extremesSeries[0].push(Math.floor(times.overallTimes.fastestWarmMs! * 10000) / 10);
//     extremesSeries[1].push(Math.floor(times.overallTimes.slowestWarmMs! * 10000) / 10);
//     extremesSeries[2].push(Math.floor(times.overallTimes.fastestColdMs! * 10000) / 10);
//     extremesSeries[3].push(Math.floor(times.overallTimes.slowestColdMs! * 10000) / 10);
//   });

//   const avgSeriesData = {
//     title: 'Average Cold/Warm Response Times Across Memory Configurations',
//     labels,
//     series: avgSeries,
//   };
//   const extremesSeriesData = {
//     title: 'Fastest and Slowest Response Times Across Memory Configurations',
//     labels,
//     series: extremesSeries,
//   };

//   chartistSvg('bar', avgSeriesData, opts).then((html: any) => {
//     fs.writeFileSync(`./traces/${functionName}-${RUN_ID}-response-times-average.svg`, html);
//   });
//   chartistSvg('bar', extremesSeriesData, opts).then((html: any) => {
//     fs.writeFileSync(`./traces/${functionName}-${RUN_ID}-response-times-extremes.svg`, html);
//   });
// };

(async () => {
  console.log('[SETUP] Starting benchmark of:', FN_NAMES);
  const benchmarkRuns = FN_NAMES.map(async (functionName) => {
    console.log(`[SETUP] Function Name = ${functionName}`);
    console.log(`[SETUP][${functionName}] Run ID = ${RUN_ID}`);
    if (!functionName) {
      console.error("No 'FUNCTION_NAME' was set!");
      process.exit(1);
    }

    try {
      const summary = await main(functionName);
      RUN_SUMMARY.header += summary.header;
      RUN_SUMMARY.sep += summary.sep;
      RUN_SUMMARY.avgWarm += summary.avgWarm;
      RUN_SUMMARY.avgCold += summary.avgCold;
      RUN_SUMMARY.fastestWarm += summary.fastestWarm;
      RUN_SUMMARY.slowestWarm += summary.slowestWarm;
      RUN_SUMMARY.fastestCold += summary.fastestCold;
      RUN_SUMMARY.slowestCold += summary.slowestCold;
    } catch (err) {
      console.error(`[ERROR][${functionName}] Benchmark failed unexpectedly:`, err);
      process.exit(1);
    }
  });
  await Promise.all(benchmarkRuns);
  console.log(RUN_SUMMARY);
  fs.writeFileSync(
    `./traces/${RUN_ID}-summary.md`,
    `
# Benchmark: Summary of run ${RUN_ID}

${RUN_SUMMARY.header}
${RUN_SUMMARY.sep}
${RUN_SUMMARY.avgWarm}
${RUN_SUMMARY.avgCold}
${RUN_SUMMARY.fastestWarm}
${RUN_SUMMARY.slowestWarm}
${RUN_SUMMARY.fastestCold}
${RUN_SUMMARY.slowestCold}
`,
  );
})();