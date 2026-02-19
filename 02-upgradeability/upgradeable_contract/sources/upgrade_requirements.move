/// Module showcasing the upgrade requirements
/// dev: In some cases, developers might want to edit/extend structs(and thus, shared/owned objects) after upgrade
/// to edit objects after upgrade, we use dynamic fields, as the static fields are not editable after upgrade
/// dev: see: https://docs.sui.io/guides/developer/packages/upgrade#upgrade-requirements
/// dev: see also: https://docs.sui.io/guides/developer/packages/custom-policies
/// dev: Upgraded version (dummy) can be found in the upgrade_requirements_v2 module
module upgradeable_contract::upgrade_requirements;

use upgradeable_contract::version_manager::Version;

// ==================== STRUCTS AND OBJECTS ====================

/// Example Object
public struct DummyURObject has key {
    id: UID,
    value: u64,
}

public fun mint_dummy_ur_object(version: &Version, value: u64, ctx: &mut TxContext) {
    version.assert_is_valid();
    transfer::transfer(DummyURObject { id: object::new(ctx), value: value }, @0x1);
}

#[allow(unused_function)]
// INTERNAL function
// can be removed after upgrade
// signature can be changed after upgrade
fun dummy_internal_function(version: &Version) {
    version.assert_is_valid();
}

// PUBLIC function
// cannot be removed after upgrade
// signature cannot be changed after upgrade
public fun dummy_public_function(version: &Version) {
    version.assert_is_valid();
}

// PACKAGE function
// can be removed after upgrade
// signature can be changed after upgrade
public(package) fun dummy_public_package_function(version: &Version) {
    version.assert_is_valid();
}

// ENTRY function
// can be removed after upgrade
// signature can be changed after upgrade
entry fun dummy_entry_function(version: &Version) {
    version.assert_is_valid();
}
