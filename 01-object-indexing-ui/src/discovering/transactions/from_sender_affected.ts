import { buildGraphQLQueryForTransactions } from "./transactions.helpers";

/**
 * Discover transactions from a given sender address using GraphQL RPC
 * @dev This function does not include error handling and forces casting as non-nil, consider adding error handling in the future.
 * @param {string} senderAddress - The address of the sender
 */
export const discoverTransactionsFromSender = async (senderAddress: string) => {
    const result = await buildGraphQLQueryForTransactions({ senderAddress });

    return result.data!.transactions!.nodes;
}

/**
 * Discover transactions affecting a given address using GraphQL RPC
 * @dev This function does not include error handling and forces casting as non-nil, consider adding error handling in the future.
 * @param {string} affectedAddress - The address affected by the transaction
 */
export const discoverTransactionsFromAffected = async (affectedAddress: string) => {
    const result = await buildGraphQLQueryForTransactions({ affectedAddress });

    return result.data!.transactions!.nodes;
}
