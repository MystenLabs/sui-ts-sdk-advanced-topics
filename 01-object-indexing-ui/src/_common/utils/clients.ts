import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export const suiGraphQLClient: SuiGraphQLClient = new SuiGraphQLClient({
    network: "mainnet",
    url: "https://graphql.mainnet.sui.io/graphql",
});

export const suiGrpcClient: SuiGrpcClient = new SuiGrpcClient({
    network: "mainnet",
    baseUrl: getJsonRpcFullnodeUrl("mainnet"),
});

/**
 * @deprecated
 * @dev This client is deprecated and will be removed in the future.
 * @dev Use `suiGrpcClient` instead.
 */
export const suiJsonRpcClient: SuiJsonRpcClient = new SuiJsonRpcClient({
    network: "mainnet",
    url: getJsonRpcFullnodeUrl("mainnet"),
});
