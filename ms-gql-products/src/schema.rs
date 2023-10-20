use async_graphql::{ComplexObject, Object, SimpleObject, ID};

#[derive(SimpleObject, Clone)]
struct Product {
    id: ID,
    name: String,
    price: String,
}

/// Define the User entity so that we can extend it.
#[derive(SimpleObject)]
#[graphql(complex)]
struct User {
    id: ID,
}

/// Set up a simple database of products.
fn products() -> Vec<Product> {
    vec![
        Product { id: "1".into(), name: "Avocado plushie".to_string(), price: "$12".to_string() },
        Product {
            id: "2".into(),
            name: "Carrot stick figure".to_string(),
            price: "$14".to_string(),
        },
        Product { id: "3".into(), name: "Tomato pillow".to_string(), price: "$22".to_string() },
        Product { id: "4".into(), name: "Pumpkin snuggie".to_string(), price: "$8".to_string() },
    ]
}

/// Set up a simple database of which products a user has
/// purchased.
fn purchases(id: &ID) -> Vec<Product> {
    let products = products();
    match id.as_str() {
        "1" => vec![products.get(0).unwrap().clone(), products.get(1).unwrap().clone()],
        "2" => vec![products.get(2).unwrap().clone(), products.get(3).unwrap().clone()],
        "3" => vec![products.get(0).unwrap().clone(), products.get(4).unwrap().clone()],
        _ => vec![],
    }
}

/// Extend the User entity with a purchases field.
#[ComplexObject]
impl User {
    async fn purchases(&self) -> Vec<Product> {
        purchases(&self.id)
    }
}

pub struct Query;

#[Object]
impl Query {
    /// Make the Product object accessible with ID as the key.
    #[graphql(entity)]
    async fn find_product_by_id(&self, id: ID) -> Product {
        products().iter().find(|p| p.id == id).unwrap().clone()
    }

    /// We need to define this so that the User.id field gets
    /// regonized as a @key, and not something this subgraph
    /// provides.
    #[graphql(entity)]
    async fn find_user_by_id(&self, #[graphql(key)] id: ID) -> User {
        User { id }
    }

    async fn product(&self, id: ID) -> Product {
        products().iter().find(|p| p.id == id).unwrap().clone()
    }

    async fn products(&self) -> Vec<Product> {
        products()
    }
}
