use apollo_router::{ApolloRouterError, Configuration, RouterHttpServer};
use lambda_http::Error;

#[cfg(not(feature = "local"))]
use lambda_http::{run, service_fn, IntoResponse, Request};
#[cfg(not(feature = "local"))]
use reqwest::{header::CONTENT_TYPE, Client, Response};
#[cfg(not(feature = "local"))]
use tracing::debug;

/// Invoke the router locally by sending the event to the router's local HTTP server.
#[cfg(not(feature = "local"))]
async fn invoke(event: &Request) -> Result<Response, Error> {
    let url = format!("http://127.0.0.1:4000");

    let body = event.body();
    let event_payload = std::str::from_utf8(body).expect("invalid utf-8 sequence");

    let client = Client::new();
    debug!("Proxying request to router: {:?}", event_payload);

    let resp = client
        .post(url)
        // TODO: Pass down whitelisted headers from the Lambda event.
        .header(CONTENT_TYPE, "application/json")
        .body(event_payload.to_string())
        .send()
        .await?;
    debug!("Response from router: {:?}", resp);
    Ok(resp)
}

/// Pass on the Lambda event to the router and return the response.
///
/// NOTE: We keep retrying the request every 10ms until we get a response from
/// the router. This is because the router takes a short time to start up.
#[cfg(not(feature = "local"))]
async fn handle_request(event: Request) -> Result<impl IntoResponse, Error> {
    let mut retries = 0;
    let mut response = invoke(&event).await;
    while retries < 500 && response.is_err() {
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        response = invoke(&event).await;
        retries += 1;
    }
    println!("Retries: {}, waited a total {}ms", retries, retries * 10);
    let resp = response?;
    let status = resp.status();
    let payload = resp.json::<serde_json::Value>().await?;

    // TODO: Return whitelisted headers from the Router response.
    Ok((status, payload))
}

async fn local() -> Result<(), ApolloRouterError> {
    let config = include_str!("../router.yaml");
    let schema = include_str!("../../ms-router/supergraph.graphql");
    let configuration = serde_yaml::from_str::<Configuration>(config).unwrap();
    RouterHttpServer::builder().configuration(configuration).schema(schema).start().await
}

#[cfg(feature = "local")]
async fn handler() -> Result<(), Error> {
    println!("Starting server at http://127.0.0.1:4000");
    local().await.map_err(|e| Error::from(e.to_string()))
}

#[cfg(not(feature = "local"))]
async fn handler() -> Result<(), Error> {
    tokio::spawn(async move { local().await });

    // Set up the Lambda event handler.
    run(service_fn(|event: Request| async { handle_request(event).await })).await
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::WARN)
        // disable printing the name of the module in every log line.
        .with_target(false)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        // disable coloring.
        .with_ansi(false)
        .init();
    handler().await
}
