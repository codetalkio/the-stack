// use apollo_router::services::supergraph;
// use apollo_router::TestHarness;
use lambda_http::{run, service_fn, Body, Error, Request, Response};
use tower::ServiceExt;
use tracing::{debug, info};

#[cfg(feature = "local")]
use reqwest::{Client, StatusCode};
#[cfg(feature = "local")]
use std::{net::IpAddr, str::FromStr};

// Potential way we could go about this:
// - Use the actual regular apollo-router (not as a library)
// - Run it as a webservice in a thread
// - Have the main handler take the Lambda Event and then call the web server locally
// - Implement a subgraph_service plugin to control communication to subgraphs via lambda
//   https://docs.rs/apollo-router/1.13.2/apollo_router/plugin/trait.Plugin.html#method.subgraph_service

#[cfg(feature = "local")]
async fn invoke_local(data: &str) -> Result<String, Error> {
    let invoke_address = IpAddr::from_str("127.0.0.1")?.to_string();
    let invoke_port = 3065;
    let function_name = "_";
    let host = invoke_address;

    let url = format!(
        "http://{}:{}/2015-03-31/functions/{}/invocations",
        &host, invoke_port, &function_name
    );

    let client = Client::new();
    let resp = client.post(url).body(data.to_string()).send().await?;
    let success = resp.status() == StatusCode::OK;
    let payload = resp.text().await?;

    if success {
        Ok(payload)
    } else {
        Err(payload.into())
    }
}

#[cfg(not(feature = "local"))]
async fn invoke_local(data: &str) -> Result<String, Error> {
    Ok("Unimplemented".to_string())
}

/// This is the main body for the function.
/// Write your code inside it.
/// There are some code examples in the Runtime repository:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
async fn handle_request(event: Request) -> Result<Response<Body>, Error> {
    // Extract the query from the request.
    info!("event: '{:#?}'", event);
    let body = event.body();
    let query = std::str::from_utf8(body).expect("invalid utf-8 sequence");

    let inv = invoke_local("{\"body\": \"\"}").await;
    info!("Test invoke: {:?}", inv);

    // Builder for the part of an Apollo Router that handles GraphQL requests, as a tower::Service.
    //
    // This allows tests, benchmarks, etc to manipulate request and response objects in memory
    // without going over the network on the supergraph side.
    //
    // On the subgraph side, this test harness never makes network requests to subgraphs unless
    // with_subgraph_network_requests is called.
    //
    // Compared to running a full RouterHttpServer, this test harness is lacking:
    // - Custom endpoints from plugins
    // - The health check endpoint
    // - CORS?
    // - HTTP compression
    let config = serde_json::json!({"supergraph": { "introspection": true }});
    // let router = TestHarness::builder()
        // .schema(include_str!("../supergraph.graphql"))
        // .with_subgraph_network_requests()
        // .configuration_json(config)?
        // .build_router()
        // .await?;

    // ...then create a GraphQL request...
    // let request = supergraph::Request::fake_builder()
        // .query(query)
        // .build()
        // .expect("expecting valid request");

    // ... and run it against the router service!
    // let r = router.clone();
    // let res = r
        // .oneshot(request.try_into()?)
        // .await?
        // .next_response()
        // .await
        // .expect("expecting a response from the router");

    // Return the response.
    // let resp = match res {
        // Ok(response) => Response::builder()
            // .status(200)
            // .header("content-type", "application/json")
            // .body(std::str::from_utf8(response.to_vec().as_slice())?.into())
            // .map_err(Box::new)?,
        // Err(err) => Response::builder()
            // .status(400)
            // .header("content-type", "application/json")
            // .body(format!("{err}").as_str().into())
            // .map_err(Box::new)?,
    // };
    let resp = Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body("".into())
            .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // NOTE: apollo-router sets up its own tracing.
    run(service_fn(|event: Request| async {
        handle_request(event).await
    }))
    .await
}
