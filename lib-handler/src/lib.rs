use async_graphql::{ObjectType, SubscriptionType};
use lambda_http::Error;

mod handler;

#[cfg(not(feature = "local"))]
/// Set up a Lambda Handler to accept incoming GraphQL requests.
///
/// NOTE: Used for production when running in AWS Lambda environments.
pub async fn handler<Query, Mutation, Subscription>(
    _port: i32,
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
) -> Result<(), Error>
where
    Query: ObjectType + 'static,
    Mutation: ObjectType + 'static,
    Subscription: SubscriptionType + 'static,
{
    handler::lambda::handler(query, mutation, subscription).await
}

#[cfg(feature = "local")]
/// Set up a local GraphQL and GraphiQL server being served on localhost
/// and on the given port.
///
/// NOTE: Only used for local testing.
pub async fn handler<Query, Mutation, Subscription>(
    port: i32,
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
) -> Result<(), Error>
where
    Query: ObjectType + 'static,
    Mutation: ObjectType + 'static,
    Subscription: SubscriptionType + 'static,
{
    handler::local::handler(port, query, mutation, subscription).await
}
