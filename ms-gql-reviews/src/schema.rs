use async_graphql::{ComplexObject, Object, SimpleObject, ID};

#[derive(SimpleObject, Clone)]
struct Review {
    id: ID,
    body: String,
    author: User,
    product: Product,
}

/// Define the Product entity so that we can extend it.
#[derive(SimpleObject, Clone)]
#[graphql(complex)]
struct Product {
    id: ID,
}

/// Define the User entity so that we can extend it.
#[derive(SimpleObject, Clone)]
#[graphql(complex)]
struct User {
    id: ID,
}

/// Set up a simple database of reviews.
fn reviews() -> Vec<Review> {
    vec![
        Review {
            id: "1".into(),
            body: "Amazing avocado plushie!".to_string(),
            author: User { id: "1".into() },
            product: Product { id: "1".into() },
        },
        Review {
            id: "1".into(),
            body: "Cool carrot stick".to_string(),
            author: User { id: "1".into() },
            product: Product { id: "2".into() },
        },
        Review {
            id: "2".into(),
            body: "Never slept better than with the tomato pillow".to_string(),
            author: User { id: "2".into() },
            product: Product { id: "3".into() },
        },
        Review {
            id: "3".into(),
            body: "The pumpkin is very snug!".to_string(),
            author: User { id: "2".into() },
            product: Product { id: "4".into() },
        },
        Review {
            id: "4".into(),
            body: "Love the plushie!".to_string(),
            author: User { id: "3".into() },
            product: Product { id: "1".into() },
        },
    ]
}

/// Extend the User entity with a reviews field.
#[ComplexObject]
impl User {
    async fn reviews(&self) -> Vec<Review> {
        let reviews = reviews();
        reviews.iter().filter(|r| r.author.id == self.id).cloned().collect()
    }
}

/// Extend the Product entity with a reviews field.
#[ComplexObject]
impl Product {
    async fn reviews(&self) -> Vec<Review> {
        let reviews = reviews();
        reviews.iter().filter(|r| r.author.id == self.id).cloned().collect()
    }
}

pub struct Query;

#[Object]
impl Query {
    /// Make the Review object accessible with ID as the key.
    #[graphql(entity)]
    async fn find_review_by_id(&self, id: ID) -> Review {
        reviews().iter().find(|r| r.id == id).unwrap().clone()
    }

    /// We need to define this so that the User.id field gets
    /// regonized as a @key, and not something this subgraph
    /// provides.
    #[graphql(entity)]
    async fn find_user_by_id(&self, #[graphql(key)] id: ID) -> User {
        User { id }
    }

    /// We need to define this so that the Review.id field gets
    /// regonized as a @key, and not something this subgraph
    /// provides.
    #[graphql(entity)]
    async fn find_product_by_id(&self, #[graphql(key)] id: ID) -> Product {
        Product { id }
    }

    async fn review(&self, id: ID) -> Review {
        reviews().iter().find(|r| r.id == id).unwrap().clone()
    }

    async fn reviews(&self) -> Vec<Review> {
        reviews()
    }
}
