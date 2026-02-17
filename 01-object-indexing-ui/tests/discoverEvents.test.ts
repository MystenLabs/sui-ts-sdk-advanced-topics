import { discoverEventsFromPackageOrModule, discoverEventsByType } from "../src/discovering/events/from_package_module_struct";
import { describe, it, expect, beforeAll } from 'bun:test';
import { OrderPlacedEventStruct, type FilterType, type ParsedEvent } from "../src/_common/types";
import { discoverEventsFromTransaction } from "../src/discovering/events/from_transaction";
import { bcs, type BcsStruct } from "@mysten/sui/bcs";

describe('Discover Events', () => {
    let packageId: string;
    let moduleType: string;
    let moduleSender: string
    let struct: string;
    let txId: string;
    let eventStruct: BcsStruct<any>;

    const assertEvents = (events: ParsedEvent[], byType: boolean = false) => {
        expect(events).toBeDefined();
        expect(events.length).toBeGreaterThan(0);
        events.forEach(event => {
            expect(event.type).toBeDefined();
            expect(event.json).toBeDefined();
            if (byType) {
                expect(event.type).toBe(`${packageId}::${moduleType}::${struct}`);
            }
        });
    };

    beforeAll(() => {
        packageId = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809';
        moduleType = 'order_info'; // module for the type of the event
        moduleSender = 'pool'; // module belonging to the package that Sent the event
        struct = 'OrderPlaced';
        /** 
         * TxId (digest) of the transaction to discover events from
         * @dev This transaction also includes OrderInfo for the module,
         * which shares fields with OrderPlaced, so bcs decoding will work the same for both events
         */
        txId = 'DZ6zK1Wj9W7geBH4FGG2HspHM9fYpawy2VyGmkzKtKp1';

        eventStruct = OrderPlacedEventStruct;
    });

    describe('By Package or Module', () => {
        it('should discover events from a given package', async () => {
            const result = await discoverEventsFromPackageOrModule(`${packageId}`);
            assertEvents(result);
        });
        it('should discover events from a given module', async () => {
            const result = await discoverEventsFromPackageOrModule(`${packageId}::${moduleSender}`);
            assertEvents(result);
        });
    });

    describe('By Type', () => {
        it('should discover events of a given fully qualified type', async () => {
            const result = await discoverEventsByType(`${packageId}::${moduleType}::${struct}` as Extract<FilterType, `${string}::${string}::${string}`>);
            assertEvents(result);
        });
    });

    describe('From Transaction', () => {
        it('should discover events from a given transaction using gRPC', async () => {
            const result = await discoverEventsFromTransaction(txId, eventStruct);
            assertEvents(result);
        });
    });

});
