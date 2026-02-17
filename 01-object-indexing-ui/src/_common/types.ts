import { bcs } from "@mysten/sui/bcs";

/**
 * @dev Filter type: `package::module` or `package::module::struct` or `package`
 */
export type FilterType = `${string}::${string}` | `${string}::${string}::${string}` | `${string}`;

/**
 * @dev Parsed event in Typescript
 */
export type ParsedEvent = {
    type: string;
    json: Record<string, unknown>;
}

/**
 * @dev Transaction filters for graphQL RPC "transactions" query
 */
export type TransactionFilterGraphQL = {
    senderAddress: string;
    affectedAddress?: never;
    packageOrModuleOrFunction?: never;
} | {
    senderAddress?: never;
    affectedAddress: string;
    packageOrModuleOrFunction?: never;
} | {
    senderAddress?: never;
    affectedAddress?: never;
    packageOrModuleOrFunction: string;
}

/**
 * @dev Return type of transactions discovered from GraphQL RPC
 */
export type TransactionNode = {
    digest: string;
    effects: {
        effectsJson: unknown;
    };
}

/**
 * @dev Event struct for OrderPlaced event
 */
export const OrderPlacedEventStruct = bcs.struct("OrderPlaced", {
    balance_manager_id: bcs.Address,
    client_order_id: bcs.Address,
    expire_timestamp: bcs.U64,
    is_bid: bcs.Bool,
    order_id: bcs.Address,
    placed_quantity: bcs.U64,
    pool_id: bcs.Address,
});
