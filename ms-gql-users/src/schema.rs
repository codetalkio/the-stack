use async_graphql::{Object, SimpleObject, ID};

#[derive(SimpleObject)]
struct User {
    id: ID,
    name: String,
}

pub struct Query;

#[Object]
impl Query {
    /// Make the User object accessible with ID as the key.
    #[graphql(entity)]
    async fn find_user_by_id(&self, id: ID) -> User {
        User { id, name: "John Deere".to_string() }
    }

    async fn me(&self) -> User {
        User { id: "1".into(), name: "John Deere".to_string() }
    }

    async fn users(&self) -> Vec<User> {
        vec![
            User { id: "1".into(), name: "John Deere".to_string() },
            User { id: "2".into(), name: "Abby Moore".to_string() },
            User { id: "3".into(), name: "Tom Hubble".to_string() },
            User { id: "4".into(), name: "Bob Thorn".to_string() },
            User { id: "5".into(), name: "Millie Wadler".to_string() },
        ]
    }
}
