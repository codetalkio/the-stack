use leptos::*;

mod fetch;
use crate::fetch::fetch_example;

pub fn main() {
    console_error_panic_hook::set_once();
    _ = console_log::init_with_level(log::Level::Debug);
    console_error_panic_hook::set_once();
    mount_to_body(fetch_example)
}
