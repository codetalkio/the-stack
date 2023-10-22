use lambda_http::Error;
use lambda_http::{run, service_fn, IntoResponse, Request};
use reqwest::{header::CONTENT_TYPE, Client, Response, StatusCode};
use std::env;
use tokio::process::Command;
use tracing::debug;

/// Invoke the router locally by sending the event to the router's local HTTP server.
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
