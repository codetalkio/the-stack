use apollo_router::services::supergraph;
use apollo_router::TestHarness;
use tower::ServiceExt;

use lambda_http::{run, service_fn, Body, Error, Request, Response};

/// This is the main body for the function.
/// Write your code inside it.
/// There are some code examples in the Runtime repository:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    // TestHarness creates a GraphQL pipeline to process queries against a supergraph Schema
    let router = TestHarness::builder()
        .schema(include_str!("../supergraph.graphql"))
        .with_subgraph_network_requests()
        .build_router()
        .await?;

    // ...then create a GraphQL request...
    let request = supergraph::Request::fake_builder()
        .query(r#"query Query { me { name } }"#)
        .build()
        .expect("expecting valid request");

    // ... and run it against the router service!
    let res = router
        .oneshot(request.try_into()?)
        .await?
        .next_response()
        .await
        .unwrap()?;

    // {"data":{"me":{"name":"Ada Lovelace"}}}
    // println!("{}", std::str::from_utf8(res.to_vec().as_slice())?);

    // Extract some useful information from the request

    // Return something that implements IntoResponse.
    // It will be serialized to the right response event automatically by the runtime
    let resp = Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(std::str::from_utf8(res.to_vec().as_slice())?.into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::ERROR)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
