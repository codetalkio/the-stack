#[cfg(not(feature = "local"))]
pub mod lambda;

#[cfg(feature = "local")]
pub mod local;
