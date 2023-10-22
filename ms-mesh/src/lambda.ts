import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";

import { createBuiltMeshHTTPHandler } from "../.mesh";

// Set up Xray to capture all HTTP/HTTPS requests.
AWSXRay.captureHTTPsGlobal(http);
AWSXRay.captureHTTPsGlobal(https);

interface ServerContext {
  event: APIGatewayProxyEventV2;
  lambdaContext: Context;
}

const meshHTTP = createBuiltMeshHTTPHandler<ServerContext>();

export async function graphqlHandler(
  event: APIGatewayProxyEventV2,
  lambdaContext: Context
): Promise<APIGatewayProxyResult> {
  const url = new URL(event.rawPath, "http://localhost");
  if (event.queryStringParameters != null) {
    for (const name in event.queryStringParameters) {
      const value = event.queryStringParameters[name];
      if (value != null) {
        url.searchParams.set(name, value);
      }
    }
  }

  const response = await meshHTTP.fetch(
    url,
    {
      // For v1.0 you should use event.httpMethod
      method: event.requestContext.http.method,
      headers: event.headers as HeadersInit,
      body: event.body
        ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
        : undefined,
    },
    {
      event,
      lambdaContext,
    }
  );

  const responseHeaders: Record<string, string> = Object.fromEntries(
    response.headers.entries()
  );

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  };
}
