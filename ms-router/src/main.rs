use lambda_http::Error;
use lambda_http::{run, service_fn, IntoResponse, Request};
use reqwest::{header::CONTENT_TYPE, Client, StatusCode};
use std::env;
use tokio::process::Command;
use tracing::debug;

/// Invoke the router locally by sending the event to the router's local HTTP server.
async fn invoke_local(event: &Request) -> Result<String, Error> {
    let url = format!("http://127.0.0.1:4000");

    let body = event.body();
    let event_payload = std::str::from_utf8(body).expect("invalid utf-8 sequence");

    let client = Client::new();
    debug!("Proxying request to router: {:?}", event_payload);

    let resp = client
        .post(url)
        .header(CONTENT_TYPE, "application/json")
        .body(event_payload.to_string())
        .send()
        .await?;
    debug!("Response from router: {:?}", resp);

    let success = resp.status() == StatusCode::OK;
    let payload = resp.text().await?;

    // TODO: Pass down headers.
    if success {
        Ok(payload)
    } else {
        Err(payload.into())
    }
}

/// Pass on the Lambda event to the router and return the response.
///
/// NOTE: We keep retrying the request every 10ms until we get a response from
/// the router. This is because the router takes a short time to start up.
async fn handle_request(event: Request) -> Result<impl IntoResponse, Error> {
    let mut retries = 0;
    let mut response = invoke_local(&event).await;
    while retries < 500 && response.is_err() {
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        response = invoke_local(&event).await;
        retries += 1;
    }
    println!("Retries: {}, waited a total {}ms", retries, retries * 10);
    response
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tokio::spawn(async move {
        // Setting PATH_ROUTER to the path of the router binary will use that binary
        // instead of the one in the default development one. This is used in the Lambda
        // environment.
        let router_binary = env::var("PATH_ROUTER").unwrap_or("./bin/router".to_string());
        // Start the Apollo Router.
        let mut router = Command::new(router_binary)
            .arg("--anonymous-telemetry-disabled")
            .arg("--config=router.yaml")
            .arg("--supergraph=supergraph.graphql")
            // .arg("--log=debug")
            .spawn()
            .expect("failed to spawn router");
        router.wait().await.expect("failed to wait on router")
    });

    // Set up the Lambda event handler.
    run(service_fn(|event: Request| async { handle_request(event).await })).await
}
