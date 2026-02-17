import { discoverObjects, type ObjectContents } from "../src/discovering/objects/from_package_module_struct";
import { describe, it, expect, beforeAll } from 'bun:test';
import { discoverObjectsFromTransaction, type ObjectsChanged } from "../src/discovering/objects/from_transaction";

describe('Discover Objects', () => {
    let packageId: string;
    let module: string;
    let struct: string;
    let grpcDigest: string;
    let graphqlDigest: string;

    beforeAll(() => {
        packageId = '0xe74481697f432ddee8dd6f9bd13b9d0297a5b63d55f3db25c4d3b5d34dad85b7';
        module = 'data_store';
        struct = 'InternalDataStore';
        graphqlDigest = '2TcGg9jcX2yDnkHv1pDx5Cn1KAUBTAeSC6gRdD2EcwwC'; // not available via gRPC as too old
        grpcDigest = '25exArrB5DAHzmDeeDEL76U83BgTMoVRRn5AzkJMPjtK';
    });

    const assertObjects = (objects: ObjectContents[], typeInclude?: ("module" | "struct")[]) => {
        expect(objects).toBeDefined();
        objects.forEach(object => {
            expect(object).toBeDefined();
            expect(object.json).toBeDefined();
            expect(object.type).toBeDefined();
            expect(object.type.repr).toBeDefined();
            expect(object.type.repr).toContain(`${packageId}`);
            if (typeInclude) {
                if (typeInclude.includes("module")) {
                    expect(object.type.repr).toContain(`${module}`);
                }
                if (typeInclude.includes("struct")) {
                    expect(object.type.repr).toContain(`${module}::${struct}`);

                }
            }
        });
        expect(objects.length).toBeGreaterThan(0);
    };

    const assertObjectsChanged = (objs: ObjectsChanged) => {
        expect(objs).toBeDefined();
        expect((objs.created.concat(objs.deleted).concat(objs.mutated)).length).toBeGreaterThan(0);
        expect(objs.created).toBeDefined();
        expect(objs.deleted).toBeDefined();
        expect(objs.mutated).toBeDefined();
    };

    describe('By Package, Module or Struct', () => {
        it('should discover objects from a given package', async () => {
            const objects = await discoverObjects(`${packageId}`);
            assertObjects(objects);
            expect(objects.length).toBeGreaterThan(0);
        });
        it('should discover objects from a given module', async () => {
            const objects = await discoverObjects(`${packageId}::${module}`);
            assertObjects(objects, ["module"]);
        });
        it('should discover objects of a given fully qualified type', async () => {
            const objects = await discoverObjects(`${packageId}::${module}::${struct}`);
            assertObjects(objects, ["struct"]);
        });
    });

    describe('From Transaction', () => {
        it('should discover objects from a given transaction using gRPC', async () => {
            const objects = await discoverObjectsFromTransaction(grpcDigest, "grpc");
            // assertObjectsChanged(objects);
        });
        it('should discover objects from a given transaction using GraphQL RPC', async () => {
            const objects = await discoverObjectsFromTransaction(graphqlDigest, "graphql");
            assertObjectsChanged(objects);
        });
    });

});