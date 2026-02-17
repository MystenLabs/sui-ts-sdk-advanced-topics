import type { SuiClientTypes } from "@mysten/sui/client";
import { suiGraphQLClient, suiGrpcClient } from "../../_common/utils/clients";
import type { GraphQLQueryResult } from "@mysten/sui/graphql";

/**
 * @dev Common Full type of the changed objects in effects(gRPC)/effectsJson(GraphQL)
 */
type ChangedObjectsFullType = SuiClientTypes.Transaction<{ effects: true }>["effects"]["changedObjects"];

/**
 * @dev Object changes in a transaction
 */
// grpc: access object changes via Transaction.effects.changedObjects
export type GetTransactionResultGrpc = SuiClientTypes.TransactionResult<{ effects: true }>;
// graphql: access object changes via data.transaction.effects.effectsJson.changedObjects
export type GetTransactionResultGraphQL = GraphQLQueryResult<{ transaction: { effects: { effectsJson: { changedObjects: ChangedObjectsFullType } } } }>;

/**
 * @dev Wrapped return type for the effects of a transaction
 */
export type ObjectsChanged = {
    created: ChangedObjectsFullType; // idOperation: 'Created'
    deleted: ChangedObjectsFullType; // idOperation: 'Deleted'
    mutated: ChangedObjectsFullType; // idOperation: 'None'
}

const filterChangesByOperation = (changes: ChangedObjectsFullType, by: "created" | "deleted" | "mutated") => {
    const operation = by === "created" ? "Created" : by === "deleted" ? "Deleted" : "None";
    return changes.filter(
        (change) => change.idOperation === operation
            || change.idOperation === by.toUpperCase() // currently GraphQL RPC returns idOperations in lowercase, e.g. 'None' as 'NONE'
    );
}

/**
 * @dev Discover objects from a given transaction using gRPC or GraphQL RPC
 * @dev Some past transactions may not be available via gRPC, consider using GraphQL RPC as a fallback if needed.
 * @dev This function does not include error handling and forces casting as non-nil, consider adding error handling in the future.
 * @param digest - The digest of the transaction
 * @returns {ObjectsChanged} The objects changed in the transaction
 */
export const discoverObjectsFromTransaction = async (digest: string, client: "grpc" | "graphql") => {
    let returnedObjects: ObjectsChanged = {
        created: [],
        deleted: [],
        mutated: []
    };

    if (client === "grpc") {
        const result = await suiGrpcClient.getTransaction({
            digest,
            include: {
                effects: true
            }
        }) as GetTransactionResultGrpc;

        const changedObjects = result.Transaction?.effects.changedObjects!;

        returnedObjects.created = filterChangesByOperation(changedObjects, "created");
        returnedObjects.deleted = filterChangesByOperation(changedObjects, "deleted");
        returnedObjects.mutated = filterChangesByOperation(changedObjects, "mutated");
    }
    else {
        const result = await suiGraphQLClient.query({
            query: `
                query GetTransaction($digest: String!) {
                    transaction(digest: $digest) {
                        effects {
                            effectsJson
                        }
                    }
                }
            `,
            variables: { digest }
        }) as GetTransactionResultGraphQL;

        const changedObjects = result.data!.transaction.effects.effectsJson.changedObjects!;
        returnedObjects.created = filterChangesByOperation(changedObjects, "created");
        returnedObjects.deleted = filterChangesByOperation(changedObjects, "deleted");
        returnedObjects.mutated = filterChangesByOperation(changedObjects, "mutated");
    }

    return returnedObjects;

}