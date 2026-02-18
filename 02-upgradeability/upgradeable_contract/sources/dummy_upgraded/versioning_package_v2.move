/// Dummy upgraded package for the versioning_package module
/// dev: example showing how functions can be changed to support new features/checks, or be deprecated
/// dev: in real world scenarios the module name would be different
module upgradeable_contract::versioning_package_v2;

use std::string::String;
use sui::coin::Coin;
use sui::sui::SUI;
use upgradeable_contract::version_manager::Version;

// ==================== STRUCTS ====================

public struct DummyObject has key {
    id: UID,
    value: String,
}

// ==================== CONSTANTS ====================
// dummy receiver for funds
// dev: in real-world scenarios, ideally, this would not be a constant but a variable inside another object so it can be changed later
const FUNDS_RECEIVER_ADDRESS: address = @0x1;

// ==================== ERROR CODES ====================
const EInvalidInput: u64 = 0;
const EDeprecated: u64 = 1;
const ENotSupported: u64 = 2;

// ==================== PUBLIC FUNCTIONS ====================
public fun sum_numbers(version: &Version, a: u64, b: u64): u64 {
    version.assert_is_valid();
    assert!(a < 100 && b < 100, EInvalidInput);
    a + b
}

#[allow(unused_variable)]
#[deprecated(note = b"Use `mint_dummy_object_v2` instead")]
// deprecated, will now use mint_dummy_object_v2
public fun mint_dummy_object(version: &Version, value: String, ctx: &mut TxContext) {
    version.assert_is_valid();
    abort EDeprecated
}

// replacement for mint_dummy_object supporting new signature
public fun mint_dummy_object_v2(
    version: &Version,
    value: String,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    version.assert_is_valid();
    assert!(payment.value() > 1000, EInvalidInput);
    transfer::public_transfer(payment, FUNDS_RECEIVER_ADDRESS);
    transfer::share_object(DummyObject { id: object::new(ctx), value: value });
}

// still valid after upgrade
public fun transfer_dummy_object(version: &Version, obj: DummyObject, to: address) {
    version.assert_is_valid();
    transfer::transfer(obj, to);
}

#[allow(unused_variable)]
// removed: can't burn objects anymore after upgrade
public fun burn_dummy_object(version: &Version, obj: DummyObject) {
    version.assert_is_valid();
    abort ENotSupported
}
