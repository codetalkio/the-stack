use async_graphql::{ObjectType, Schema, SubscriptionType};
use lambda_http::Error;
use lambda_http::{
    http::header::CONTENT_TYPE, http::StatusCode, run, service_fn, Body, IntoResponse, Request,
    Response,
};
use serde_json::json;
use tracing::info;

async fn handle_request<Query, Mutation, Subscription>(
    schema: &Schema<Query, Mutation, Subscription>,
    event: Request,
) -> Result<impl IntoResponse, Error>
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
    let req: async_graphql::Request =
        serde_json::from_str(&payload).expect("unable to deserialize payload into graphql request");
    let graphql_response = schema.execute(req).await;
    let json = serde_json::to_string(&graphql_response)?;

    info!(payload = %json, "Schema responded:");

    // FIXME: This is a hack to get the content-type to be application/json. Impl IntoResponse
    // automatically sets it, and we otherwise end up with a content-type of text/html.
    let v = serde_json::from_str::<serde_json::Value>(&json)?;
    Ok(v)
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
