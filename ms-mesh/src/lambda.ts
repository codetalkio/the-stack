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

const invoke = async (
  event: APIGatewayProxyEventV2,
  lambdaContext: Context
): Promise<APIGatewayProxyResult> => {
  const url = new URL("http://localhost/");
  if (event.queryStringParameters != null) {
    for (const name in event.queryStringParameters) {
      const value = event.queryStringParameters[name];
      if (value != null) {
        url.searchParams.set(name, value);
      }
    }
  }

  const request = {
    method: event.requestContext.http.method,
    headers: event.headers as HeadersInit,
    body: event.body
      ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
      : undefined,
  };
  const response = await meshHTTP.fetch(url, request, {
    event,
    lambdaContext,
  });

  const responseHeaders: Record<string, string> = Object.fromEntries(
    response.headers.entries()
  );

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  };
};

export async function graphqlHandler(
  event: APIGatewayProxyEventV2,
  lambdaContext: Context
): Promise<APIGatewayProxyResult> {
  try {
    return await invoke(event, lambdaContext);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
      isBase64Encoded: false,
    };
  }
}
