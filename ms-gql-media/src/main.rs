// use aws_sdk_dynamodb::types::AttributeValue;
// use aws_sdk_dynamodb::{Client, Error as OtherError};
use lambda_http::{run, service_fn, Body, Error, Request, Response};
use tracing::info;

use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};

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

struct Query;

#[Object]
impl Query {
    /// Returns the sum of a and b
    async fn add(&self, a: i32, b: i32) -> i32 {
        a + b
    }
}

pub type SubgraphSchema = Schema<Query, EmptyMutation, EmptySubscription>;

/// This is the main body for the function.
/// Write your code inside it.
/// You can see more examples in Runtime's repository:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
async fn handle_request(event: Request) -> Result<Response<Body>, Error> {
    // Extract some useful information from the request
    let body = event.body();
    let s = std::str::from_utf8(body).expect("invalid utf-8 sequence");
    //Log into Cloudwatch
    info!(payload = %s, "JSON Payload received");

    // let schema = Schema::new(Query, EmptyMutation, EmptySubscription);
    // let res = schema.execute("{ add(a: 10, b: 20) }").await;
    // let json = serde_json::to_string(&res)?;

    //Send back a 200 - success
    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(s.into())
        .map_err(Box::new)?;
    Ok(resp)
}

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
async fn handler() -> Result<(), Error> {
    let schema = Schema::new(Query, EmptyMutation, EmptySubscription);

    let app = Router::new()
        .route("/", get(graphiql).post(graphql_handler))
        .layer(Extension(schema));

    println!("GraphiQL IDE: http://localhost:3065");

    Server::bind(&"127.0.0.1:3065".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .map_err(|_| panic!("Something went wrong"))
}

#[cfg(not(feature = "local"))]
async fn handler() -> Result<(), Error> {
    run(service_fn(|event: Request| async {
        handle_request(event).await
    }))
    .await
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
