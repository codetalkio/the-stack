// use aws_sdk_dynamodb::types::AttributeValue;
// use aws_sdk_dynamodb::{Client, Error as OtherError};
use async_graphql::{EmptyMutation, EmptySubscription};
use lambda_http::Error;

mod schema;

use crate::schema::*;

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        // disable coloring.
        .with_ansi(false)
        .init();
    lib_handler::handler(3075, Query, EmptyMutation, EmptySubscription).await
}
