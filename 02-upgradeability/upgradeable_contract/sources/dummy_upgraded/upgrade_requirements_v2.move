/// Dummy upgraded version of the upgrade_requirements
/// dev: module showcasing the upgrade requirements
/// dev: In some cases, developers might want to edit/extend structs(and thus, shared/owned objects) after upgrade
/// to edit objects after upgrade, we use dynamic fields, as the static fields are not editable after upgrade
/// dev: see: https://docs.sui.io/guides/developer/packages/upgrade#upgrade-requirements
/// dev: in real world scenarios the module name would be different
module upgradeable_contract::upgrade_requirements_v2;

use std::string::String;
use sui::dynamic_field as df;
use sui::dynamic_object_field as dof;
use upgradeable_contract::version_manager::Version;

// ==================== ERRORS ====================
const EDummyAbort: u64 = 100;

// ==================== STRUCTS AND OBJECTS ====================

/// Example Object
public struct DummyURObject has key {
    id: UID,
    value: u64,
    // can't add more static fields
    // but we can add dynamic fields
}

/// Example Object to be added as a DOF
public struct NewDummyUrObject has key, store {
    id: UID,
    value: u64,
    another_value: bool,
}

public fun mint_dummy_ur_object(version: &Version, value: u64, ctx: &mut TxContext) {
    version.assert_is_valid();
    transfer::transfer(DummyURObject { id: object::new(ctx), value: value }, @0x1);
}

public fun add_dfield_to_dummy_ur_object(version: &Version, obj: &mut DummyURObject) {
    version.assert_is_valid();
    df::add<String, u64>(&mut obj.id, b"dfield".to_string(), 10);
}

public fun add_dobj_field_to_dummy_ur_object(
    version: &Version,
    obj: &mut DummyURObject,
    ctx: &mut TxContext,
) {
    version.assert_is_valid();
    dof::add<String, NewDummyUrObject>(
        &mut obj.id,
        b"dobj".to_string(),
        NewDummyUrObject { id: object::new(ctx), value: 10, another_value: true },
    );
}

public fun read_dfield_from_dummy_ur_object(
    version: &Version,
    field: String,
    obj: &DummyURObject,
): u64 {
    version.assert_is_valid();
    *df::borrow<String, u64>(&obj.id, field)
}

public fun read_dobj_properties_from_dummy_ur_object(
    version: &Version,
    obj: &DummyURObject,
): (u64, bool) {
    version.assert_is_valid();
    let dobj = dof::borrow<String, NewDummyUrObject>(&obj.id, b"dobj".to_string());
    (dobj.value, dobj.another_value)
}

// INTERNAL function "dummy_internal_function" has been removed

// PUBLIC function "dummy_public_function" content has been changed, but signature not
public fun dummy_public_function(version: &Version) {
    version.assert_is_valid();
    abort EDummyAbort
}

#[allow(unused_variable)]
// PACKAGE function "dummy_public_package_function" content and signature have been changed
public(package) fun dummy_public_package_function(version: &Version, param: u64) {
    version.assert_is_valid();
    abort EDummyAbort
}

// ENTRY function "dummy_entry_function" stayed the same
entry fun dummy_entry_function(version: &Version) {
    version.assert_is_valid();
}
