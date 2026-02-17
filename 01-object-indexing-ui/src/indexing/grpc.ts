import type { BcsStruct } from "@mysten/sui/bcs";
import { suiGrpcClient } from "../_common/utils/clients";

const processCheckpoint = async (
  response: any,
  fullEventType: string,
  eventStruct: BcsStruct<any>,
  onEvent: (parsed: any) => void,
): Promise<void> => {
  const checkpoint = response.checkpoint;
  if (!checkpoint) {
    return;
  }

  if (!checkpoint.transactions || checkpoint.transactions.length === 0) {
    return;
  }

  for (const transaction of checkpoint.transactions) {
    // console.log("Transaction:", transaction);

    if (!transaction.events?.events || transaction.events.events.length === 0) {
      continue;
    }

    for (const event of transaction.events.events) {
      if (event.eventType !== fullEventType || !event.bcs) {
        continue;
      }
      try {
        onEvent(eventStruct.parse(event.bcs));
      } catch {
        onEvent("Found event but failed to decode: " + JSON.stringify(event));
        // skip events that fail to decode
      }
    }
  }
};

export const startEventsListener = async (
    fullEventType: string,
    eventStruct: BcsStruct<any>,
    options?: {
      signal?: AbortSignal;
      onEvent?: (parsed: any) => void;
    }
) => {
  const stream = suiGrpcClient.subscriptionService.subscribeCheckpoints({
    readMask: {
      paths: [
        "transactions.events",
        /** @dev also supports: */
        // "transactions"
        // "sequenceNumber",
        // "digest",
        // "transactions.digest",
        // "transactions.timestamp",
        /** and more */
      ],
    },
  });

  const handleEvent = options?.onEvent ?? ((data) => console.log("Event Data:", data));

  console.log("Subscribed to checkpoint stream...");
  try {
    for await (const response of stream.responses) {
      if (options?.signal?.aborted) break;
      try {
        await processCheckpoint(response, fullEventType, eventStruct, handleEvent);
      } catch (error) {
        console.log("Error while processing checkpoint:", error);
      }
    }
  } catch (error) {
    if (options?.signal?.aborted) return;
    throw error;
  }
};
