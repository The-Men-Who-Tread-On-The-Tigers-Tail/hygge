use rand::Rng;

pub fn choose_index(len: usize) -> Option<usize> {
    let mut rng = rand::thread_rng();

    choose_index_with(&mut rng, len)
}

pub fn choose_index_with<R: Rng + ?Sized>(rng: &mut R, len: usize) -> Option<usize> {
    if len == 0 {
        None
    } else {
        Some(rng.gen_range(0..len))
    }
}

#[cfg(test)]
mod tests {
    use super::{choose_index, choose_index_with};
    use rand::{Rng, SeedableRng, rngs::StdRng};

    #[test]
    fn choose_index_returns_none_for_empty_collection() {
        let mut rng = StdRng::seed_from_u64(7);

        assert_eq!(choose_index_with(&mut rng, 0), None);
    }

    #[test]
    fn choose_index_returns_zero_for_single_item_collection() {
        let mut rng = StdRng::seed_from_u64(7);

        assert_eq!(choose_index_with(&mut rng, 1), Some(0));
    }

    #[test]
    fn choose_index_with_seeded_rng_matches_rng_output() {
        let mut chooser_rng = StdRng::seed_from_u64(99);
        let mut expected_rng = StdRng::seed_from_u64(99);

        assert_eq!(
            choose_index_with(&mut chooser_rng, 5),
            Some(expected_rng.gen_range(0..5))
        );
    }

    #[test]
    fn choose_index_uses_same_bounds_as_public_api() {
        assert_eq!(choose_index(0), None);
    }
}
