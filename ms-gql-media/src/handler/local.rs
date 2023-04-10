// use aws_sdk_dynamodb::types::AttributeValue;
// use aws_sdk_dynamodb::{Client, Error as OtherError};
use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use lambda_http::Error;

#[cfg(feature = "local")]
use async_graphql::http::GraphiQLSource;
#[cfg(feature = "local")]
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
#[cfg(feature = "local")]
use axum::{
    extract::Extension,
    response::{self, IntoResponse},
    routing::get,
    Router, Server,
};

use crate::schema::*;

#[cfg(feature = "local")]
async fn graphql_handler(
    schema: Extension<SubgraphSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

#[cfg(feature = "local")]
async fn graphiql() -> impl IntoResponse {
    response::Html(GraphiQLSource::build().endpoint("/").finish())
}

#[cfg(feature = "local")]
pub async fn handler() -> Result<(), Error> {
    let schema = Schema::build(Query, EmptyMutation, EmptySubscription)
        .enable_federation()
        .finish();

    let app = Router::new()
        .route("/", get(graphiql).post(graphql_handler))
        .layer(Extension(schema));

    println!("GraphiQL IDE: http://localhost:3065");

    Server::bind(&"127.0.0.1:3065".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .map_err(|_| panic!("Something went wrong"))
}
