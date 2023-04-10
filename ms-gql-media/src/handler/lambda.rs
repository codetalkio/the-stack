use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use lambda_http::Error;

#[cfg(not(feature = "local"))]
use lambda_http::{run, service_fn, Body, Request, Response};
#[cfg(not(feature = "local"))]
use tracing::info;

use crate::schema::*;

#[cfg(not(feature = "local"))]
async fn handle_request(schema: &SubgraphSchema, event: Request) -> Result<Response<Body>, Error> {
    // Extract the body from the Lambda event.
    let body = event.body();
    let payload = std::str::from_utf8(body).expect("invalid utf-8 sequence");

    info!(payload = %payload, "JSON Payload received:");

    // Pass the Lambda event to the GraphQL schema.
    let graphql_query: async_graphql::Request = serde_json::from_str(payload)?;
    let graphql_response = schema.execute(graphql_query).await;
    let json = serde_json::to_string(&graphql_response)?;

    info!(payload = %json, "Schema responded:");

    // Send back a response with the result of the GraphQL query.
    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(json.into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[cfg(not(feature = "local"))]
pub async fn handler() -> Result<(), Error> {
    let schema = Schema::new(Query, EmptyMutation, EmptySubscription);

    run(service_fn(|event: Request| async {
        handle_request(&schema, event).await
    }))
    .await
}
