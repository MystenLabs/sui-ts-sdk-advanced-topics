import type { GraphQLQueryResult } from "@mysten/sui/graphql";
import type { TransactionFilterGraphQL, TransactionNode } from "../../_common/types";
import { suiGraphQLClient } from "../../_common/utils/clients";

/**
 * Build a query for transactions using GraphQL RPC
 * @param {TransactionFilterGraphQL} filter - The filter to use for the query
 */
export const buildGraphQLQueryForTransactions = async (
    filter: TransactionFilterGraphQL
): Promise<GraphQLQueryResult<{ transactions: { nodes: TransactionNode[] } }>> => {

    const query = `
        query DiscoverTransactions($senderAddress: String, $affectedAddress: String, $packageOrModuleOrFunction: String) {
            transactions(filter: { sentAddress: $senderAddress, affectedAddress: $affectedAddress, function: $packageOrModuleOrFunction }) {
                nodes {
                    digest
                    effects {
                        effectsJson
                    }
                }
            }
        }
    `;
    let variables: { sentAddress?: string, affectedAddress?: string, function?: string } = {};

    if (filter.senderAddress) {
        variables.sentAddress = filter.senderAddress;
    }
    else if (filter.affectedAddress) {
        variables.affectedAddress = filter.affectedAddress;
    }
    else if (filter.packageOrModuleOrFunction) {
        variables.function = filter.packageOrModuleOrFunction;
    }
    else {
        throw new Error(`Invalid filter`);
    }

    return await suiGraphQLClient.query({
        query,
        variables
    });
}