import type { FilterType } from "../../_common/types";
import { suiGraphQLClient } from "../../_common/utils/clients";

/**
 * @dev Query objects by type result
 */
export type QueryObjectsByTypeResult = {
    data: {
        objects: {
            nodes: {
                asMoveObject: {
                    contents: {
                        json: Record<string, unknown>
                        type: { repr: string }
                    },
                }
            }[]
        }
    }
}
/**
 * @dev Parsed result type for object contents
 */
export type ObjectContents = QueryObjectsByTypeResult['data']['objects']['nodes'][number]["asMoveObject"]["contents"];

/**
 * Discover objects from a given project by object type using GraphQL RPC
 * @dev This method is currently only available via GraphQL RPC
 * @param filter filter type: `package::module`, `package::module::struct`, or `package`
 * @returns {ObjectContents[]} objects mapped to their contents(json)
 */
export const discoverObjects = async (filter: FilterType): Promise<ObjectContents[]> => {

    const result = await suiGraphQLClient.query({
        query: `
            query QueryObjectsByType($filter: String!) {
                objects(filter:{ type: $filter}) {
                    nodes { 
                        asMoveObject {
                            contents {
                                json
                                type { repr }
                            }
                        }
                    }
                }
            }
        `,
        variables: { filter }
    }) as QueryObjectsByTypeResult;


    return result.data.objects.nodes.map(node => node.asMoveObject.contents);
};
