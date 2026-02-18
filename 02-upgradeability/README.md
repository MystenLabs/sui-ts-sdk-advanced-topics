# Upgradeability Patterns in Sui Move

This module demonstrates practical upgradeability patterns for Sui Move smart contracts, focusing on version gating, migration safety, package-level compatibility control, and upgrade requirements.

Rather than presenting a single rigid approach, this package walks through **three complementary upgrade enforcement patterns** and an **upgrade requirements reference**, giving developers the tools to pick the right strategy for their use case.

1. **Package-level compatibility gating** — the `Version` object pattern
2. **Object-level migration gating** — the per-object version pattern
3. **Mixed versioning** — combining both for maximum safety
4. **Upgrade requirements** — what you can and cannot change after a package upgrade

Each pattern includes a corresponding **dummy upgraded (v2)** module that shows exactly what changes look like after a real upgrade.

> **Note:** Some functions in this package use `Publisher` checks to gate sensitive operations like migration. This is done to demonstrate good security practices — in a real-world contract you would always want similar access control — but it is not the focus of this material. The focus is on the versioning patterns themselves.

---

## Table of Contents

- [What You'll Learn](#what-youll-learn)
- [Project Structure](#project-structure)
- [File Reference](#file-reference)
- [Core Concepts](#core-concepts)
  - [1. Package-Level Compatibility: The Version Object Pattern](#1-package-level-compatibility-the-version-object-pattern)
  - [2. Object-Level Migration: Per-Object Version Pattern](#2-object-level-migration-per-object-version-pattern)
  - [3. Mixed Versioning: Best of Both Worlds](#3-mixed-versioning-best-of-both-worlds)
  - [4. Upgrade Requirements: What Can Change?](#4-upgrade-requirements-what-can-change)
- [The Version Manager](#the-version-manager)
- [Upgrade Flow](#upgrade-flow)
- [Pattern Comparison](#pattern-comparison)
- [Advantages and Disadvantages](#advantages-and-disadvantages)
- [Key Takeaways](#key-takeaways)
- [Further Reading](#further-reading)

---

## What You'll Learn

By exploring this package, you will understand:

- How to enforce that callers always use the latest deployed package version
- How to prevent interaction with unmigrated shared objects
- How to implement controlled state migration
- How to combine package-level and object-level versioning for layered safety
- What Sui allows (and forbids) you to change after a package upgrade
- How to extend objects post-upgrade using dynamic fields
- How to deprecate, replace, or remove functions across upgrades
- How to design a pause mechanism for safe upgrade rollouts

---

## Project Structure

```
02-upgradeability/
├── README.md
├── VersionedSharedObject.png
└── upgradeable_contract/
    ├── Move.toml
    ├── Move.lock
    ├── sources/
    │   ├── error_codes.move
    │   ├── version_manager.move
    │   ├── versioning_package.move
    │   ├── versioning_shared_objects.move
    │   ├── versioning_mixed.move
    │   ├── upgrade_requirements.move
    │   └── dummy_upgraded/
    │       ├── version_manager_v2.move
    │       ├── versioning_package_v2.move
    │       └── upgrade_requirements_v2.move
    └── tests/
        └── upgradeable_contract_tests.move
```

---

## File Reference

| File | Purpose |
|------|---------|
| `error_codes.move` | Shared error code macros used across the entire package. |
| `version_manager.move` | Central version management: the `Version` shared object, version assertions, pause/unpause, migration, and the `is_supported_version_for_object` dispatch. |
| `versioning_package.move` | Demonstrates **package-wide versioning** — every function takes a `&Version` reference and asserts it matches the current package version. |
| `versioning_shared_objects.move` | Demonstrates **per-object versioning** — shared objects (`SharedPool`, `SharedRegistry`) carry their own `version` field, checked independently of the global `Version` object. |
| `versioning_mixed.move` | Demonstrates **mixed versioning** — functions that require *both* the global `Version` check and per-object version checks for maximum safety. |
| `upgrade_requirements.move` | Reference for Sui upgrade rules: which function visibilities can be changed/removed, and how dynamic fields extend objects post-upgrade. |
| `dummy_upgraded/version_manager_v2.move` | V2 of the version manager — shows how `current_version!()` and `is_supported_version_for_object` change after an upgrade. |
| `dummy_upgraded/versioning_package_v2.move` | V2 of the package versioning module — shows function deprecation (`#[deprecated]`), replacement (`mint_dummy_object_v2`), added validation, and removal (`burn_dummy_object` → abort). |
| `dummy_upgraded/upgrade_requirements_v2.move` | V2 of the upgrade requirements module — shows adding dynamic fields/object fields, removing internal functions, and changing `public(package)` signatures. |

---

## Core Concepts

### 1. Package-Level Compatibility: The Version Object Pattern

**Defined in:** `versioning_package.move`

A shared `Version` object (managed by `version_manager.move`) represents the current expected version of the package. Every entry point receives `&Version` and calls `assert_is_valid()`, ensuring callers are targeting the latest deployment.

```move
public fun sum_numbers(version: &Version, a: u64, b: u64): u64 {
    version.assert_is_valid();
    a + b
}
```

After an upgrade, the developer increments `current_version!()` and calls `migrate()` on the `Version` object. From that point on, **any call routed through an older package** will fail because its compiled `current_version!()` no longer matches the on-chain `Version`.

#### Advantages

- **Simple** — a single `Version` object covers the entire package.
- **One migration call** — the developer calls `migrate()` once to update the global version.
- **Clean separation** — deployed code version vs. on-chain version state are clearly distinct.
- **Easy to reason about** — if `Version` matches, the caller is on the latest package.

#### Disadvantages

- **Version object must be passed everywhere** — every function that needs gating requires `&Version` as input.
- **All-or-nothing** — you cannot selectively support older package versions for specific objects or functions.
- **No per-object granularity** — does not protect against unmigrated shared objects individually.

---

### 2. Object-Level Migration: Per-Object Version Pattern

**Defined in:** `versioning_shared_objects.move`

Each shared object stores its own `version` field, initialized with `version_manager::current_version!()` at creation time. Functions check the object's version using `is_supported_version_for_object<T>()`, which dispatches on the object's type name to determine the minimum supported version.

```move
public fun deposit_into_pool<T0, T1>(
    registry: &SharedRegistry,
    pool: &mut SharedPool<T0, T1>,
    coin0: Coin<T0>,
    coin1: Coin<T1>,
) {
    assert!(
        version_manager::is_supported_version_for_object<SharedPool<T0, T1>>(pool.get_pool_version()),
        error_codes::ENotSupportedObjectVersion!(),
    );
    assert!(
        version_manager::is_supported_version_for_object<SharedRegistry>(registry.get_registry_version()),
        error_codes::ENotSupportedObjectVersion!(),
    );
    deposit_into_pool_internal(registry, pool, coin0, coin1);
}
```

Migration is done per-object via dedicated functions:

```move
public fun migrate_shared_pool<T0, T1>(pool: &mut SharedPool<T0, T1>) {
    pool.version = version_manager::current_version!();
}
```

#### Advantages

- **Fine-grained control** — each object can be migrated independently on its own schedule.
- **Backward compatibility** — older packages can still interact with objects if the version check passes.
- **No Version object required in function signatures** — functions only need the objects themselves.
- **Selective support** — you can choose to support or drop support for specific object versions individually.

#### Disadvantages

- **More complex** — requires explicit version fields and migration functions per object type.
- **Overkill for simple contracts** — if you only have one or two shared objects, the overhead may not be worth it.
- **Manual migration** — the developer must explicitly migrate each object individually after an upgrade.
- **Type-name dispatch** — `is_supported_version_for_object` relies on string-based type matching, which can be fragile.

---

### 3. Mixed Versioning: Best of Both Worlds

**Defined in:** `versioning_mixed.move`

Some operations are critical enough to warrant **both** layers of protection. The mixed pattern combines the global `Version` check with per-object version checks:

```move
public fun set_pool_in_registry(
    version: &Version,
    registry: &mut SharedRegistry,
    pool_id: ID,
    pool_state: bool,
) {
    version.assert_is_valid();
    version.versions_match(registry.get_registry_version());
    versioning_shared_objects::set_pool_in_registry_internal(registry, pool_id, pool_state);
}
```

This enforces:

1. The caller is on the **latest package** (via `Version`)
2. The **shared object** has been migrated (via `versions_match`)

#### When to Use Mixed Versioning

- **Admin/governance operations** — state changes that affect the entire protocol (e.g., enabling/disabling pools).
- **Sensitive withdrawals** — moving funds out of shared pools where both package alignment and object migration are critical.
- **Cross-module calls** — when a function in one module mutates objects defined in another module.

---

### 4. Upgrade Requirements: What Can Change?

**Defined in:** `upgrade_requirements.move` (v1) and `upgrade_requirements_v2.move` (v2)

Sui enforces strict rules on what a compatible upgrade can modify. This module serves as a living reference:

| Visibility | Can Remove? | Can Change Signature? |
|------------|:-----------:|:---------------------:|
| `fun` (internal) | Yes | Yes |
| `public(package)` | Yes | Yes |
| `entry` | Yes | Yes |
| `public` | **No** | **No** |

**Struct fields** cannot be added or removed after publication. To extend objects, use **dynamic fields** (`sui::dynamic_field`) or **dynamic object fields** (`sui::dynamic_object_field`):

```move
// Adding a dynamic field to an existing object
public fun add_dfield_to_dummy_ur_object(version: &Version, obj: &mut DummyURObject) {
    version.assert_is_valid();
    df::add<String, u64>(&mut obj.id, b"dfield".to_string(), 10);
}

// Adding a dynamic object field
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
```

The v2 module also demonstrates:
- **Deprecating** a public function (keeping the signature, aborting in the body, adding `#[deprecated]`)
- **Replacing** a function with a new version (`mint_dummy_object` → `mint_dummy_object_v2`)
- **Removing** an internal function entirely
- **Changing** a `public(package)` function's signature

---

## The Version Manager

**Defined in:** `version_manager.move`

The `version_manager` module is the backbone of all patterns. It provides:

| Component | Description |
|-----------|-------------|
| `Version` struct | Shared object holding the current version and a pause flag. |
| `current_version!()` macro | Compile-time constant returning the current package version number. Increment this on every upgrade. |
| `assert_is_valid()` | Asserts the `Version` object matches `current_version!()`. Used for package-wide gating. |
| `versions_match()` | Checks if a given object version matches the `Version` object's version. Used in mixed patterns. |
| `is_supported_version_for_object<T>()` | Type-dispatched check: given an object's type and version, returns whether it is supported. Used for per-object gating. |
| `pause()` / `unpause()` / `is_paused()` | Pause mechanism to freeze all interactions during an upgrade window. |
| `migrate()` | Updates the `Version` object to the current package version after an upgrade. |

---

## Upgrade Flow

A recommended upgrade flow using the pause mechanism:

```
1. Developer calls pause() on the Version object
      ↓
2. Developer publishes the upgraded package
   (with incremented current_version!())
      ↓
3. Developer calls migrate() on the Version object
      ↓
4. Developer migrates individual shared objects
   (migrate_shared_pool, migrate_shared_registry, etc.)
      ↓
5. Developer calls unpause() on the Version object
      ↓
6. Users can now interact with the upgraded package
```

This ensures **no user transactions execute against a partially-migrated state**.

---

## Pattern Comparison

| | Package-Level (`versioning_package`) | Object-Level (`versioning_shared_objects`) | Mixed (`versioning_mixed`) |
|---|---|---|---|
| **Scope** | Entire package | Individual shared objects | Both |
| **What it checks** | `Version` object matches `current_version!()` | Object's `version` field is supported | Both checks |
| **Migration** | Single `migrate()` call | Per-object migration calls | Both |
| **Granularity** | All-or-nothing | Per-object, per-type | Per-function, layered |
| **Complexity** | Low | Medium | High |
| **Best for** | Simple packages, few shared objects | Complex DeFi protocols with many pools/registries | Admin operations, sensitive state mutations |
| **Version object in signature?** | Yes | No | Yes |

---

## Advantages and Disadvantages

### Why Version Gating Matters

Without version gating:

- Old shared objects may interact with new logic incorrectly
- State invariants may silently break after upgrades
- Upgrades may introduce undefined behavior across shared state
- Users could exploit the window between upgrade and migration

With these patterns:

- Upgrades become **explicit** — both the developer and the protocol acknowledge the transition
- Migration is **controlled** — objects can be migrated on a defined schedule
- Compatibility and state safety are **enforced at runtime** — not just by convention
- The pause mechanism prevents **race conditions** during the upgrade window

### Trade-offs at a Glance

| Consideration | Package-Level | Object-Level | Mixed |
|---|---|---|---|
| Developer overhead | Low | Medium-High | High |
| User friction (extra input) | `Version` object in every call | None (checked internally) | `Version` object in every call |
| Backward compatibility | None (old packages rejected) | Possible (version ranges) | None |
| Partial migration safety | No | Yes | Yes |
| Suitable for multi-object protocols | Limited | Excellent | Excellent |
| Auditability | High (single checkpoint) | Medium (distributed checks) | High (layered) |

---

## Key Takeaways

1. **Start simple.** If your package has few shared objects and straightforward logic, **package-level versioning** is often enough.

2. **Scale with complexity.** As your protocol grows (multiple pools, registries, vaults), **object-level versioning** gives you the granularity to migrate incrementally.

3. **Layer for critical paths.** For admin operations and sensitive state mutations, **mixed versioning** provides defense-in-depth.

4. **Use dynamic fields for extensibility.** Struct fields are frozen after publication — plan ahead with dynamic fields if you anticipate post-upgrade extensions.

5. **Pause before you upgrade.** The pause mechanism ensures no user transactions slip through during the migration window.

6. **Study the v2 modules.** The `dummy_upgraded/` directory shows concrete before/after examples — deprecation, replacement, removal, and extension patterns you will encounter in production.

---

## Further Reading

- [Sui Package Upgrades](https://docs.sui.io/guides/developer/packages/upgrade) — official guide on upgrade mechanics and policies
- [Upgrade Requirements](https://docs.sui.io/guides/developer/packages/upgrade#upgrade-requirements) — what changes are allowed under each compatibility policy
- [Custom Upgrade Policies](https://docs.sui.io/guides/developer/packages/custom-policies) — how to define your own upgrade authorization rules
- [Dynamic Fields](https://docs.sui.io/guides/developer/sui-101/dynamic-fields) — extending objects without changing their struct layout
