/// Package-wide versioning pattern (global Version object)
/// dev: Purpose: Having a Version shared object (central) that needs to be passed always as input in functions
/// Older packages won't be able to call this function since their internal versions won't match the upgraded Version object's version
/// dev: Advantages:
/// - developer needs to call migrate just one time (global)
/// - simple
/// dev: Disadvantages:
/// - can't support older packages methods that check the version, or individual shared objects versions in new packages
/// - developer needs to pass the Version object everytime in input
/// dev: Upgraded version (dummy) can be found in the versioning_package_v2 module
module upgradeable_contract::versioning_package;

use std::string::String;
use upgradeable_contract::version_manager::Version;

// ==================== STRUCTS ====================

public struct DummyObject has key {
    id: UID,
    value: String,
}

// ==================== PUBLIC FUNCTIONS ====================
/// dev: Dummy functions showing package-wide versioning(deprecating older packages)
/// dev: Older packages won't be able to call the functions since their internal versions won't match the upgraded Version object's version

public fun sum_numbers(version: &Version, a: u64, b: u64): u64 {
    version.assert_is_valid();
    a + b
}

public fun mint_dummy_object(version: &Version, value: String, ctx: &mut TxContext) {
    version.assert_is_valid();
    transfer::share_object(DummyObject { id: object::new(ctx), value: value });
}

public fun transfer_dummy_object(version: &Version, obj: DummyObject, to: address) {
    version.assert_is_valid();
    transfer::transfer(obj, to);
}

public fun burn_dummy_object(version: &Version, obj: DummyObject) {
    version.assert_is_valid();
    let DummyObject { id, .. } = obj;
    object::delete(id);
}
