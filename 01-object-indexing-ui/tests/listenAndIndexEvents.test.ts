import { describe, it, expect, beforeAll } from 'bun:test';
import { OrderPlacedEventStruct } from "../src/_common/types";
import { startEventsListener } from "../src/indexing/grpc";
import type { BcsStruct } from "@mysten/sui/bcs";

describe('Listen and Index Events', () => {
    let fullEventType: string;
    let packageId: string;
    let moduleType: string;
    let struct: string;
    let eventStruct: BcsStruct<any>;

    beforeAll(() => {
        packageId = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809';
        moduleType = 'order_info';
        struct = 'OrderPlaced';
        fullEventType = `${packageId}::${moduleType}::${struct}`;
        eventStruct = OrderPlacedEventStruct;
    });

    describe('gRPC Subscription', () => {
        it('should listen and collect events for 2 seconds', async () => {
            const controller = new AbortController();
            const collectedEvents: any[] = [];

            setTimeout(() => controller.abort(), 2_000);

            await startEventsListener(fullEventType, eventStruct, {
                signal: controller.signal,
                onEvent: (parsed) => collectedEvents.push(parsed),
            });

            console.log(`Collected ${collectedEvents.length} ${fullEventType} events in ~2s`);
            expect(collectedEvents).toBeDefined();
        }, 10_000);
    });
});
