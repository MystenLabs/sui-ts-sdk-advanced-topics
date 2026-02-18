/// Shared objects-wide versioning pattern (per-object version)
/// dev: Purpose: Have versions inside the objects themselves, allowing support/unsupport of objects by their versions even if of/in older packages
/// dev: Advantages:
/// - developer has control over single versions of objects and can support previous
/// - previous packages can still interact with objects if needed
/// - do not need to pass the Version object as input in functions
/// dev: Disadvantages:
/// - complex
/// - for some business cases it might be Overkill
/// - developer needs to explicitly update every version of the objects they want to upgrade, individually
module upgradeable_contract::versioning_shared_objects;

use sui::balance::{Self, Balance};
use sui::coin::Coin;
use sui::package::{Self, Publisher};
use sui::table::{Self, Table};
use upgradeable_contract::error_codes;
use upgradeable_contract::version_manager;

// ==================== SHARED OBJECTS ====================

/// Example Pool (shared) containing two tokens and their balances
public struct SharedPool<phantom T0, phantom T1> has key {
    id: UID,
    balance0: Balance<T0>,
    balance1: Balance<T1>,
    version: u64,
}

/// Example Registry (shared) containing a table of pool IDs and a boolean value indicating if the pool is active
public struct SharedRegistry has key {
    id: UID,
    pools: Table<ID, bool>,
    version: u64,
}

// ==================== OTW ====================
public struct VERSIONING_SHARED_OBJECTS() has drop;

// ==================== INITIALIZER ====================
fun init(otw: VERSIONING_SHARED_OBJECTS, ctx: &mut TxContext) {
    transfer::share_object(SharedRegistry {
        id: object::new(ctx),
        pools: table::new(ctx),
        version: version_manager::current_version!(),
    });
    package::claim_and_keep(otw, ctx);
}

// ==================== GETTERS ====================

/// Getter for the version of the shared registry
public fun get_registry_version(registry: &SharedRegistry): u64 {
    registry.version
}

/// Getter for the version of the shared pool
public fun get_pool_version<T0, T1>(pool: &SharedPool<T0, T1>): u64 {
    pool.version
}

// ==================== MIGRATION FUNCTIONS ====================
/// dev:
/// These migration function examples gate the migration to the package version (current_version!()). 
/// Depending on the business case, there might be cases in which the developer might:
/// - disable the migration in package versions, and re-enable it in others
/// - unlink the migration function from the package version(current_version!()) and use an arbitrary version inside the functions instead

/// Example function to migrate the version of the shared pool
public fun migrate_shared_pool<T0, T1>(publisher: &Publisher, pool: &mut SharedPool<T0, T1>) {
    assert!(publisher.from_package<VERSIONING_SHARED_OBJECTS>(), error_codes::EInvalidPublisher!());
    assert!(
        pool.version < version_manager::current_version!(),
        error_codes::EVersionDowngradeNotAllowed!(),
    );
    pool.version = version_manager::current_version!();
}

/// Example function to migrate the version of the shared registry
public fun migrate_shared_registry(publisher: &Publisher, registry: &mut SharedRegistry) {
    assert!(publisher.from_package<VERSIONING_SHARED_OBJECTS>(), error_codes::EInvalidPublisher!());
    assert!(
        registry.version < version_manager::current_version!(),
        error_codes::EVersionDowngradeNotAllowed!(),
    );
    registry.version = version_manager::current_version!();
}

// ==================== INTERNAL FUNCTIONS ====================

/// Create a new pool and add it to the registry (internal)
fun create_pool_internal<T0, T1>(registry: &mut SharedRegistry, ctx: &mut TxContext) {
    let pool = SharedPool {
        id: object::new(ctx),
        balance0: balance::zero<T0>(),
        balance1: balance::zero<T1>(),
        version: version_manager::current_version!(),
    };
    table::add(&mut registry.pools, object::id(&pool), true);
    transfer::share_object(pool);
}

/// Deposit coins into a pool (internal)
fun deposit_into_pool_internal<T0, T1>(
    registry: &SharedRegistry,
    pool: &mut SharedPool<T0, T1>,
    coin0: Coin<T0>,
    coin1: Coin<T1>,
) {
    assert!(registry.pools.borrow(object::id(pool)) == true, error_codes::EPoolNotActive!());
    let coin0_as_balance = coin0.into_balance();
    let coin1_as_balance = coin1.into_balance();
    pool.balance0.join(coin0_as_balance);
    pool.balance1.join(coin1_as_balance);
}

// ==================== PACKAGE FUNCTIONS ====================

/// Withdraw coins from a pool (internal)
public(package) fun withdraw_from_pool_internal<T0, T1>(
    pool: &mut SharedPool<T0, T1>,
    amount0: u64,
    amount1: u64,
    ctx: &mut TxContext,
): (Coin<T0>, Coin<T1>) {
    let balance0 = pool.balance0.split(amount0);
    let balance1 = pool.balance1.split(amount1);
    (balance0.into_coin(ctx), balance1.into_coin(ctx))
}

/// Set(enable/disable) the state of a pool in the registry (internal)
public(package) fun set_pool_in_registry_internal(
    registry: &mut SharedRegistry,
    pool_id: ID,
    pool_state: bool,
) {
    table::add(&mut registry.pools, pool_id, pool_state);
}

// ==================== PUBLIC FUNCTIONS ====================

/// Create a new pool and add it to the registry
public fun create_pool<T0, T1>(
    publisher: &Publisher,
    registry: &mut SharedRegistry,
    ctx: &mut TxContext,
) {
    assert!(publisher.from_package<VERSIONING_SHARED_OBJECTS>(), error_codes::EInvalidPublisher!());
    assert!(
        version_manager::is_supported_version_for_object<
            SharedRegistry,
        >(registry.get_registry_version()),
        error_codes::ENotSupportedObjectVersion!(),
    );
    create_pool_internal<T0, T1>(registry, ctx);
}

/// Get the state of a pool in the registry
/// dev: Showcases how to restrict functions access object(s)-wide by checking the version of the object(s)
public fun deposit_into_pool<T0, T1>(
    registry: &SharedRegistry,
    pool: &mut SharedPool<T0, T1>,
    coin0: Coin<T0>,
    coin1: Coin<T1>,
) {
    // Check versions
    assert!(
        version_manager::is_supported_version_for_object<
            SharedPool<T0, T1>,
        >(pool.get_pool_version()),
        error_codes::ENotSupportedObjectVersion!(),
    );
    assert!(
        version_manager::is_supported_version_for_object<
            SharedRegistry,
        >(registry.get_registry_version()),
        error_codes::ENotSupportedObjectVersion!(),
    );

    // Deposit coins into the pool
    deposit_into_pool_internal(registry, pool, coin0, coin1);
}

// ==================== TEST ONLY FUNCTIONS ====================

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(VERSIONING_SHARED_OBJECTS(), ctx);
}
