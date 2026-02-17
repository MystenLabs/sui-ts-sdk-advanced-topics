import type { FilterType } from "../../_common/types";
import { suiGraphQLClient } from "../../_common/utils/clients";
import { buildGraphQLQueryForTransactions } from "./transactions.helpers";

/**
 * Discover transactions from a given package or module or function using GraphQL RPC
 * @dev This method is currently only available via GraphQL RPC, or deprecated jsonRPC as "queryTransactionBlocks"
 * @dev This function does not include error handling and forces casting as non-nil, consider adding error handling in the future.
 * @param filter filter type: `package`, `package::module`, `package::module::function`
 */
export const discoverTransactionsFromPackageOrModuleOrFunction = async (filter: Omit<FilterType, `${string}::${string}::${string}`>) => {

    /* GraphQL RPC */
    const result = await buildGraphQLQueryForTransactions({ packageOrModuleOrFunction: filter as string });
    return result.data!.transactions!.nodes;

    /** jsonRPC (deprecated) */
    // const result = await suiJsonRpcClient.queryTransactionBlocks({
    //     filter: {
    //         MoveFunction: {
    //             package: filter as string,
    //             // or
    //             module: filter as string,
    //             // or
    //             function: filter as string,
    //         }
    //     }
    // });
}