use async_graphql::{ObjectType, Schema, SubscriptionType};
use lambda_http::Error;
use lambda_http::{run, service_fn, Body, Request, Response};
use tracing::info;

async fn handle_request<Query, Mutation, Subscription>(
    schema: &Schema<Query, Mutation, Subscription>,
    event: Request,
) -> Result<Response<Body>, Error>
where
    Query: ObjectType + 'static,
    Mutation: ObjectType + 'static,
    Subscription: SubscriptionType + 'static,
{
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

pub async fn handler<Query, Mutation, Subscription>(
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
) -> Result<(), Error>
where
    Query: ObjectType + 'static,
    Mutation: ObjectType + 'static,
    Subscription: SubscriptionType + 'static,
{
    let schema = Schema::new(query, mutation, subscription);

    run(service_fn(|event: Request| async { handle_request(&schema, event).await })).await
}
