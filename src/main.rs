fn main() {
    if let Err(err) = hygge::run() {
        eprintln!("{err:#}");
        std::process::exit(1);
    }
}
