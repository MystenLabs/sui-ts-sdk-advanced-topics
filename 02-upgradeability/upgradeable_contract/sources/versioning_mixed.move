/// Mixed versioning pattern (package-wide versioning + per-object versioning)
/// dev: This pattern is a combination of the package-wide versioning pattern and the per-object versioning pattern
/// dev: For simplicity, we use the same shared objects as the versioning_shared_objects module
module upgradeable_contract::versioning_mixed;

use sui::coin::Coin;
use sui::package::Publisher;
use upgradeable_contract::error_codes;
use upgradeable_contract::version_manager::Version;
use upgradeable_contract::versioning_shared_objects::{
    Self,
    VERSIONING_SHARED_OBJECTS,
    SharedRegistry,
    SharedPool
};

/// Set(enable/disable) the state of a pool in the registry
/// dev: Package-wide versioning + Object-wide versioning
public fun set_pool_in_registry(
    version: &Version,
    publisher: &Publisher,
    registry: &mut SharedRegistry,
    pool_id: ID,
    pool_state: bool,
) {
    // Check versions and publisher
    version.assert_is_valid();
    version.versions_match(registry.get_registry_version());
    assert!(publisher.from_package<VERSIONING_SHARED_OBJECTS>(), error_codes::EInvalidPublisher!());

    // Set the state of the pool in the registry
    versioning_shared_objects::set_pool_in_registry_internal(registry, pool_id, pool_state);
}

/// Withdraw from a pool
/// dev: Package-wide versioning + Object-wide versioning
public fun withdraw_from_pool<T0, T1>(
    publisher: &Publisher,
    version: &Version,
    pool: &mut SharedPool<T0, T1>,
    amount0: u64,
    amount1: u64,
    ctx: &mut TxContext,
): (Coin<T0>, Coin<T1>) {
    // Check versions and publisher
    version.assert_is_valid();
    version.versions_match(pool.get_pool_version());
    assert!(publisher.from_package<VERSIONING_SHARED_OBJECTS>(), error_codes::EInvalidPublisher!());

    // Withdraw coins from the pool
    versioning_shared_objects::withdraw_from_pool_internal(pool, amount0, amount1, ctx)
}
