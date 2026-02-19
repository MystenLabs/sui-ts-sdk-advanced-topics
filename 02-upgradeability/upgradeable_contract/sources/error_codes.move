module upgradeable_contract::error_codes;

// Errors
public(package) macro fun EInvalidPackageVersion(): u64 { 0 }
public(package) macro fun EInvalidPublisher(): u64 { 1 }
public(package) macro fun ENotSupportedObjectVersion(): u64 { 2 }
public(package) macro fun EPoolNotFound(): u64 { 3 }
public(package) macro fun EPoolNotActive(): u64 { 4 }
public(package) macro fun EVersionDowngradeNotAllowed(): u64 { 5 }
