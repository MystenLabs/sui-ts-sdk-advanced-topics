import type { GraphQLQueryResult } from "@mysten/sui/graphql";
import type { FilterType, ParsedEvent } from "../../_common/types";
import { suiGraphQLClient } from "../../_common/utils/clients";

type EventNode = {
    contents: {
        json: Record<string, unknown>;
        type: {
            layout: {
                struct: {
                    type: string;
                }
            }
        };
    };
}

type EventQueryReturnType = {
    events: {
        nodes: EventNode[];
    };
};

const getEventTypeFromNode = (eventNode: EventNode) => {
    return eventNode.contents.type.layout.struct.type;
};

const parseEvents = (events: EventNode[]): ParsedEvent[] => {
    return events.map(node => ({
        type: getEventTypeFromNode(node),
        json: node.contents.json
    }));
}

/**
 * Helper function to build and send a query for events using GraphQL RPC
 * @dev This function does not include error handling and forces casting as non-nil, consider adding error handling in the future.
 * @param filter - The filter to use for the query
 * @param filter.senderModuleOrPackage - The module or package that Sent the event, not the parent module or package of the event
 * @param filter.structType - The fully qualified struct type of the event(s) to filter by (format: package::module::struct)
 * @returns {GraphQLQueryResult<Record<string, unknown>>} The query result
 */
const buildQueryForEvents = async (
    filter: { senderModuleOrPackage?: string, structType?: string }
): Promise<GraphQLQueryResult<EventQueryReturnType>> => {
    const result = await suiGraphQLClient.query({
        query: `
            query discoverEvents($module: String, $struct: String) {
                events(filter: { module: $module, struct: $struct }) {
                    nodes {
                        contents {
                            json
                            type {
                                layout
                            }
                        }
                    }
                }
            }
        `,
        variables: { module: filter.senderModuleOrPackage, struct: filter.structType }
    });

    return result as GraphQLQueryResult<EventQueryReturnType>;
}

/**
 * Discover events Sent by a given package or module using GraphQL RPC
 * @dev Querying past events is currently only available via GraphQL RPC, or the deprecated jsonRPC
 * @dev When querying by module or package, the senderModuleOrPackage is the module or package that sent the event, not the parent module or package of the event
 * @param filter filter type: `package::module`, `package::module::struct`, or `package`
 */
export const discoverEventsFromPackageOrModule = async (filter: Omit<FilterType, `${string}::${string}::${string}`>): Promise<ParsedEvent[]> => {
    const result = await buildQueryForEvents({ senderModuleOrPackage: (filter as string) });

    return parseEvents(result.data?.events?.nodes ?? []);
};


/**
 * Discover events by a fully qualified struct type using GraphQL RPC
 * @param filter The fully qualified struct type of the event(s) to filter by (format: package::module::struct)
 */
export const discoverEventsByType = async (filter: Extract<FilterType, `${string}::${string}::${string}`>) => {
    const result = await buildQueryForEvents({ structType: filter });

    return parseEvents(result.data?.events?.nodes ?? []);
}
