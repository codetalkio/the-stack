import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';
import AWSXRay from 'aws-xray-sdk';
import http from 'http';
import https from 'https';

// Set up Xray to capture all HTTP/HTTPS requests.
AWSXRay.captureHTTPsGlobal(http);
AWSXRay.captureHTTPsGlobal(https);

import { server } from './server';

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  // We will be using the Proxy V2 handler
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
);
