// use aws_sdk_dynamodb::types::AttributeValue;
// use aws_sdk_dynamodb::{Client, Error as OtherError};
use lambda_http::Error;

mod handler;
mod schema;

#[cfg(not(feature = "local"))]
async fn handler() -> Result<(), Error> {
    handler::lambda::handler().await
}

#[cfg(feature = "local")]
async fn handler() -> Result<(), Error> {
    handler::local::handler().await
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        .init();
    handler().await
}
