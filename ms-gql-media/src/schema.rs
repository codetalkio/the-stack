use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};

#[derive(SimpleObject)]
struct Media {
    #[graphql(shareable)]
    id: String,

    #[graphql(shareable)]
    url: String,
}

pub struct Query;

#[Object]
impl Query {
    async fn media(&self, id: String) -> Media {
        Media {
            id,
            url: "http://localhost:3065/test.png".to_string(),
        }
    }
}

pub type SubgraphSchema = Schema<Query, EmptyMutation, EmptySubscription>;
