use async_graphql::{ObjectType, Schema, SubscriptionType};
use lambda_http::Error;
use std::net::SocketAddr;

use async_graphql::http::GraphiQLSource;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::Extension,
    response::{self, IntoResponse},
    routing::get,
    Router, Server,
};

async fn graphql_handler<Query, Mutation, Subscription>(
    schema: Extension<Schema<Query, Mutation, Subscription>>,
    req: GraphQLRequest,
) -> GraphQLResponse
where
    Query: ObjectType + 'static,
    Mutation: ObjectType + 'static,
    Subscription: SubscriptionType + 'static,
{
    schema.execute(req.into_inner()).await.into()
}

async fn graphiql() -> impl IntoResponse {
    response::Html(GraphiQLSource::build().endpoint("/").finish())
}

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
    let schema = Schema::build(query, mutation, subscription).enable_federation().finish();

    let app = Router::new()
        .route("/", get(graphiql).post(graphql_handler::<Query, Mutation, Subscription>))
        .layer(Extension(schema));

    println!("GraphiQL IDE: http://127.0.0.1:{port}");

    let addr = format!("127.0.0.1:{port}");
    Server::bind(&addr.parse::<SocketAddr>().unwrap())
        .serve(app.into_make_service())
        .await
        .map_err(|_| panic!("Something went wrong"))
}
