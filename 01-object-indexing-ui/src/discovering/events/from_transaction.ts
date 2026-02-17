import type { SuiClientTypes } from "@mysten/sui/client";
import { suiGrpcClient, suiJsonRpcClient } from "../../_common/utils/clients";
import type { BcsStruct } from "@mysten/sui/bcs";
import type { ParsedEvent } from "../../_common/types";

/**
 * Discover events from a given transaction using gRPC
 * @dev
 *  - Currently, querying events from a transaction is only available via gRPC, or the deprecated jsonRPC. Not available via GraphQL RPC.
 *  - If using `grpc`, The event contents are bcs-only and should be parsed using bcs libraries
 *  - If using `jsonRPC`, The event contents are already available in json format(human-readable) in the `parsedJson` field.
 * @dev This function does not include error handling and forces casting as non-nil, consider adding error handling in the future.
 * @param txId - The digest of the transaction
 * @param eventStruct - The struct of the event as bcs parsed struct. Should be known beforehand and it is mandatory to decode the event contents.
 */
export const discoverEventsFromTransaction = async (txId: string, eventStruct: BcsStruct<any>): Promise<ParsedEvent[]> => {

    /* GRPC RPC */
    const res = await suiGrpcClient.getTransaction({
        digest: txId,
        include: {
            events: true,
            
        }
    }) as SuiClientTypes.TransactionResult<{ events: true }>;
    
    return res.Transaction!.events.map((event) => {
        return {
            type: event.eventType,
            json: eventStruct.parse(event.bcs)
        } as ParsedEvent;
    });
    
    /* json RPC (deprecated) */
    // const result = await suiJsonRpcClient.getTransactionBlock({
    //     digest: txId,
    //     options: {
    //         showEvents: true
    //     }
    // }) as any;
    // console.log(result.events[0].parsedJson);

}