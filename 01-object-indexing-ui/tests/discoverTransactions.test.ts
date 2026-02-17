import { beforeAll, describe, expect, it } from 'bun:test';
import type { TransactionNode } from "../src/_common/types";
import { discoverTransactionsFromPackageOrModuleOrFunction } from "../src/discovering/transactions/from_package_module_function";
import { discoverTransactionsFromAffected, discoverTransactionsFromSender } from "../src/discovering/transactions/from_sender_affected";

describe('Discover Transactions', () => {
    let packageId: string;
    let moduleId: string;
    let functionId: string;
    let senderAddress: string;
    let affectedAddress: string;

    const assertTransactions = (transactions: TransactionNode[]) => {
        expect(transactions).toBeDefined();
        expect(transactions.length).toBeGreaterThan(0);
        transactions.forEach(tx => {
            expect(tx.digest).toBeDefined();
            expect(tx.effects).toBeDefined();
            expect(tx.effects.effectsJson).toBeDefined();
        });
    };

    beforeAll(() => {
        packageId = '0xd0d46cd44d4c0289f3368b02b88719f7520c68cd0265991d3ae92eabe61b633b';
        moduleId = 'router';
        functionId = "swap_x_to_y";
        senderAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
        affectedAddress = '0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad';
    });

    describe('By Package or Module', () => {
        it('should discover transactions from a given package', async () => {
            const result = await discoverTransactionsFromPackageOrModuleOrFunction(`${packageId}`);
            assertTransactions(result as TransactionNode[]);
        });
        it('should discover transactions from a given module', async () => {
            const result = await discoverTransactionsFromPackageOrModuleOrFunction(`${packageId}::${moduleId}`);
            assertTransactions(result as TransactionNode[]);
        });
        it('should discover transactions from a given function', async () => {
            const result = await discoverTransactionsFromPackageOrModuleOrFunction(`${packageId}::${moduleId}::${functionId}`);
            assertTransactions(result as TransactionNode[]);
        });
    });

    describe('By Sender Address', () => {
        it('should discover transactions from a given sender address', async () => {
            const result = await discoverTransactionsFromSender(senderAddress);
            assertTransactions(result as TransactionNode[]);
        });
    });

    describe('By Affected Address', () => {
        it('should discover transactions affecting a given address', async () => {
            const result = await discoverTransactionsFromAffected(affectedAddress);
            assertTransactions(result as TransactionNode[]);
        });
    });

});
