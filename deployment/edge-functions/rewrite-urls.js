exports.handler = (event, _, callback) => {
  let request = event.Records[0].cf.request;

  // Check whether the URI is missing a file name.
  if (request.uri.endsWith("/")) {
    request.uri += "index.html";
  } else if (!request.uri.includes(".")) {
    // Check whether the URI is missing a file extension.
    request.uri += "/index.html";
  }

  return callback(null, request);
};
