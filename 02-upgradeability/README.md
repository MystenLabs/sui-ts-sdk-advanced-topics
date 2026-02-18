# Upgradeability Patterns in Sui Move

This module demonstrates practical upgradeability patterns for shared objects in Sui Move, focusing on version gating, migration safety, and package-level compatibility control.

Rather than presenting a single rigid approach, this package walks through two complementary upgrade enforcement patterns:

1. **Package-level compatibility gating (Version object pattern)**
2. **Object-level migration gating (Per-object version pattern)**

Together, they illustrate how to safely evolve smart contracts while maintaining correctness guarantees across shared state.

---

# What You’ll Learn

By exploring this package, you will understand:

* How to enforce that callers use the latest deployed package version
* How to prevent interaction with unmigrated shared objects
* How to implement controlled state migration
* How to separate compatibility enforcement from state safety
* How to design upgrade-safe shared object architectures

---

# Package Overview

This module consists of three main components:

```
upgradeable_contract/
├── example_functions.move
├── version_manager.move
└── shared_objects.move
```

Each plays a specific role in the upgrade story.
In addition, an `error_codes.move` file is included and used for shared error codes across the package.

---

# 1️⃣ Package-Level Compatibility: The `Version` Object Pattern

Defined in:

```
version_manager.move
```

## Core Idea

Introduce a shared `Version` object that represents the current expected version of the package. Entry points can require this object to ensure callers are targeting the latest deployment.

```move
public struct Version has key {
    id: UID,
    version: u64
}
```

The module also defines a package-level constant:

```move
const VERSION: u64 = 1;
```

Every time the contract is upgraded, this constant must be incremented.

---

## Compatibility Enforcement

Two assertion helpers are provided:

```move
public fun assert_is_valid(self: &Version)
public fun assert_object_version(object_version: u64)
```

* `assert_is_valid` ensures the shared `Version` object matches the compiled `VERSION`.
* `assert_object_version` ensures object state matches the compiled `VERSION`.

This enforces that:

* The deployed package version
* The shared `Version` object
* The object-level versions

remain consistent.

---

## Migration Flow

When upgrading:

1. Publish a new package with an incremented `VERSION`.
2. Update the shared `Version` object via:

```move
public fun migrate(version: &mut Version)
```

This synchronizes on-chain version state with the newly deployed package.

---

## What This Pattern Solves

This pattern provides:

* Package-wide compatibility gating
* A single “version beacon” object
* Coordinated upgrade signaling
* A clean separation between deployed code and version state

It ensures:

> “If you’re calling this contract, you must be aligned with the latest package version.”

---

# 2️⃣ Object-Level Migration: Per-Object Version Pattern

Defined in:

```
shared_objects.move
```

## Core Idea

Each shared object stores its own version field:

```move
public struct SharedPool<phantom T0, phantom T1> has key {
    ...
    version: u64
}

public struct SharedRegistry has key {
    ...
    version: u64
}
```

Each object is initialized with:

```move
version_manager::current_version()
```

---

## Enforcement

Entry points validate object-level compatibility:

```move
version_manager::assert_object_version(pool.get_pool_version());
version_manager::assert_object_version(registry.get_registry_version());
```

This guarantees:

* Objects must be migrated before being used
* Old state cannot interact with new logic
* Invariants remain safe across upgrades

---

## Migration of Shared State

To migrate shared objects after an upgrade:

```move
public fun bump_versions<T0, T1>(
    version: &Version,
    pool: &mut SharedPool<T0, T1>,
    registry: &mut SharedRegistry
)
```

This updates each object’s stored version to match the current package version.

---

## What This Pattern Solves

This pattern provides:

* State-level safety
* Protection against partially migrated systems
* Fine-grained upgrade control per shared object

It ensures:

> “This specific object instance has been migrated to the latest version.”

---

# How the Two Patterns Work Together

The package intentionally demonstrates both patterns in action.

For example:

### `set_pool_in_registry`

```move
public fun set_pool_in_registry(
    version: &Version,
    registry: &mut SharedRegistry,
    pool_id: ID,
    pool_state: bool
)
```

This function enforces:

* Package compatibility via the `Version` object
* Object-level migration via version checks on the registry

This showcases package-level compatibility combined with object-level migration enforcement.

---

### `deposit_into_pool`

```move
public fun deposit_into_pool<T0, T1>(
    registry: &SharedRegistry,
    pool: &mut SharedPool<T0, T1>,
    coin0: Coin<T0>,
    coin1: Coin<T1>
)
```

This function enforces only object-level version checks.

It demonstrates how functionality can be restricted based purely on migration state, without requiring the `Version` object as an explicit parameter.

---

# Conceptual Distinction

| Pattern               | Scope        | Purpose                     | Guarantees                                      |
| --------------------- | ------------ | --------------------------- | ====================--------------- |
| Version Object        | Package-wide | Compatibility gating        | Callers must align with latest deployed version |
| Object Version Fields | Per-object   | State migration enforcement | Shared objects must be migrated before use      |

They address different upgrade risks:

* Version object → protects the interface layer
* Object version → protects the state layer

---

# Why This Design Matters

Without version gating:

* Old shared objects may interact with new logic incorrectly
* State invariants may silently break after upgrades
* Upgrades may introduce undefined behavior across shared state

With these patterns:

* Upgrades become explicit
* Migration is controlled
* Compatibility and state safety are enforced at runtime

This module captures the core upgrade patterns required for building safe, version-aware Sui applications that rely on shared objects.
