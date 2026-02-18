/// Version manager module responsible for managing the version of the package and the objects
/// dev: Upgraded version (dummy) can be found in the version_manager_v2 module
module upgradeable_contract::version_manager;

use std::type_name;
use sui::package::Publisher;
use upgradeable_contract::error_codes;

/// Shared object with `version` which updates on every upgrade.
/// Used as input to force the end-user to use the latest contract version.
/// dev: Add a boolean flag to pause the package, so that the developer can pause the package and prevent any interactions with the package, the upgrade flow would work as:
/// 1. Developer pauses the package
/// 2. Developer upgrades the package
/// 3. Developer migrates objects/version
/// 4. Developer unpauses the package
public struct Version has key {
    id: UID,
    version: u64,
    is_paused: bool,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Version {
        id: object::new(ctx),
        version: current_version!(),
        is_paused: false,
    })
}

/// Assert that the package-version matches the `Version` object.
public fun assert_is_valid(self: &Version) {
    assert!(self.version == current_version!(), error_codes::EInvalidPackageVersion!());
}

/// Check if the version of the `Version` object matches the object-version.
public fun versions_match(self: &Version, object_version: u64): bool {
    self.version == object_version
}

/// All-in-one function to centralize the versioning logic around Shared Objects
/// dev: Another simpler way of doing this would be to have module-defined functions for each object that check the version, so checking typename would not be needed,
/// e.g.:
/// moduleX::assert_registry_version(registry: &Registry) {
///     let registry_version = registry.version;
///     let required_version = 3; // or also as a module-level constant
///     assert!(registry_version == required_version, error_codes::EInvalidRegistryVersion());
/// }
public(package) fun is_supported_version_for_object<T>(object_version: u64): bool {
    let type_name = type_name::with_original_ids<T>();
    let module_name = type_name.module_string().to_string();
    let struct_name = type_name.datatype_string().to_string();

    if (
        module_name == b"versioning_shared_objects".to_string() && struct_name == b"SharedPool".to_string()
    ) {
        object_version == 1
    } else if (
        module_name == b"versioning_shared_objects".to_string() && struct_name == b"SharedRegistry".to_string()
    ) {
        object_version == 1
    } else {
        false
    }
}

public macro fun current_version(): u64 {
    1
}

public fun current(self: &Version): u64 {
    self.version
}

public fun is_paused(version: &Version): bool {
    version.is_paused
}

public fun pause(version: &mut Version) {
    version.is_paused = true;
}

public fun unpause(version: &mut Version) {
    version.is_paused = false;
}

public fun migrate(pub: &Publisher, version: &mut Version) {
    assert!(pub.from_package<Version>(), error_codes::EInvalidPublisher!());
    version.version = current_version!();
}

//==================== TEST ONLY FUNCTIONS ====================

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
#[test_only]
public fun migrate_for_testing(version: &mut Version, new_version: u64) {
    version.version = new_version;
}
