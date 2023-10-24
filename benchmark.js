import http from "k6/http";
import { sleep } from "k6";

export default function () {
  const payload = JSON.stringify({
    query: "query { __typename }",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  http.post(`${__ENV.URL}`, payload, params);
  sleep(1);
}

// URL="..." k6 run --vus 100 --duration 20s benchmark.js
// App Runner with 0.25 vCPU and 512 MB RAM.
//
// scenarios: (100.00%) 1 scenario, 100 max VUs, 50s max duration (incl. graceful stop):
// * default: 100 looping VUs for 20s (gracefulStop: 30s)
// data_received..................: 1.9 MB 89 kB/s
// data_sent......................: 512 kB 24 kB/s
// http_req_blocked...............: avg=35.81ms min=1µs     med=6µs     max=420.19ms p(90)=180.59ms p(95)=342.98ms
// http_req_connecting............: avg=11.82ms min=0s      med=0s      max=196.95ms p(90)=55.9ms   p(95)=74.55ms
// http_req_duration..............: avg=84.36ms min=49.06ms med=58.63ms max=635.55ms p(90)=100.68ms p(95)=139.08ms
// { expected_response:true }.....: avg=84.36ms min=49.06ms med=58.63ms max=635.55ms p(90)=100.68ms p(95)=139.08ms
// http_req_failed................: 0.00%  ✓ 0         ✗ 1824
// http_req_receiving.............: avg=2.33ms  min=10µs    med=76µs    max=106.93ms p(90)=1.47ms   p(95)=3.23ms
// http_req_sending...............: avg=35.25µs min=4µs     med=28µs    max=1.61ms   p(90)=57µs     p(95)=73µs
// http_req_tls_handshaking.......: avg=23.87ms min=0s      med=0s      max=342.05ms p(90)=122.68ms p(95)=180.69ms
// http_req_waiting...............: avg=81.99ms min=48.9ms  med=58.4ms  max=613.24ms p(90)=97.71ms  p(95)=132.06ms
// http_reqs......................: 1824   86.512231/s
// iteration_duration.............: avg=1.12s   min=1.04s   med=1.06s   max=1.98s    p(90)=1.23s    p(95)=1.47s
// iterations.....................: 1824   86.512231/s
// vus............................: 4      min=4       max=100
// vus_max........................: 100    min=100     max=100
//
// running (21.1s), 000/100 VUs, 1824 complete and 0 interrupted iterations
// default ✓ [======================================] 100 VUs  20s

// URL="..." k6 run --vus 1000 --duration 20s benchmark.js
// App Runner with 0.25 vCPU and 512 MB RAM.
//
// scenarios: (100.00%) 1 scenario, 1000 max VUs, 50s max duration (incl. graceful stop):
// * default: 1000 looping VUs for 20s (gracefulStop: 30s)
// data_received..................: 15 MB  667 kB/s
// data_sent......................: 2.9 MB 128 kB/s
// http_req_blocked...............: avg=250.6ms  min=0s      med=4µs   max=2.32s    p(90)=1.43s    p(95)=1.88s
// http_req_connecting............: avg=101.75ms min=0s      med=0s    max=916.82ms p(90)=152.34ms p(95)=891.76ms
// http_req_duration..............: avg=1.22s    min=55.09ms med=1.1s  max=5.23s    p(90)=2.24s    p(95)=2.57s
// { expected_response:true }...: avg=1.87s    min=55.09ms med=1.79s max=5.23s    p(90)=2.68s    p(95)=2.9s
// http_req_failed................: 62.66% ✓ 5366       ✗ 3197
// http_req_receiving.............: avg=42.45ms  min=6µs     med=42µs  max=1.39s    p(90)=166.65ms p(95)=247.34ms
// http_req_sending...............: avg=93.38µs  min=2µs     med=13µs  max=28.92ms  p(90)=68µs     p(95)=168µs
// http_req_tls_handshaking.......: avg=141.44ms min=0s      med=0s    max=1.53s    p(90)=650.71ms p(95)=1.1s
// http_req_waiting...............: avg=1.18s    min=54.28ms med=1.09s max=4.52s    p(90)=2.17s    p(95)=2.48s
// http_reqs......................: 8563   378.263144/s
// iteration_duration.............: avg=2.47s    min=1.06s   med=2.2s  max=7.84s    p(90)=4.1s     p(95)=4.9s
// iterations.....................: 8563   378.263144/s
// vus............................: 213    min=213      max=1000
// vus_max........................: 1000   min=1000     max=1000
//
// running (22.6s), 0000/1000 VUs, 8563 complete and 0 interrupted iterations
// default ✓ [======================================] 1000 VUs  20s

// URL="..." k6 run --vus 5000 --summary-trend-stats="med,p(95),p(99.9)" --duration 20s benchmark.js
// App Runner with 0.25 vCPU and 512 MB RAM.
//
// data_received..................: 25 MB  508 kB/s
// data_sent......................: 3.7 MB 73 kB/s
// http_req_blocked...............: med=6µs   p(95)=21.77s   p(99.9)=23.21s
// http_req_connecting............: med=0s    p(95)=17.76s   p(99.9)=21.27s
// http_req_duration..............: med=1.6s  p(95)=3.67s    p(99.9)=6.28s
//   { expected_response:true }...: med=1.91s p(95)=4.11s    p(99.9)=6.29s
// http_req_failed................: 32.30% ✓ 3437       ✗ 7202
// http_req_receiving.............: med=46µs  p(95)=308.7ms  p(99.9)=3.31s
// http_req_sending...............: med=15µs  p(95)=342.09µs p(99.9)=58.17ms
// http_req_tls_handshaking.......: med=0s    p(95)=3.51s    p(99.9)=10.19s
// http_req_waiting...............: med=1.43s p(95)=3.61s    p(99.9)=6.21s
// http_reqs......................: 10639  212.759954/s
// iteration_duration.............: med=13.6s p(95)=31.18s   p(99.9)=31.24s
// iterations.....................: 10222  204.420739/s
// vus............................: 604    min=604      max=5000
// vus_max........................: 5000   min=5000     max=5000
//
// running (50.0s), 0000/5000 VUs, 10220 complete and 419 interrupted iterations
// default ✓ [======================================] 5000 VUs  20s
