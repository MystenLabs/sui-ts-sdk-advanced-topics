# Sui Typescript SDK Advanced Patterns — Learning Material

A hands-on collection of practical examples and patterns for building on [Sui](https://sui.io), covering on-chain data discovery, real-time indexing, smart contract upgradeability, performance benchmarking, and other design decisions.

Built with TypeScript, [Bun](https://bun.sh), and the official [`@mysten/sui`](https://www.npmjs.com/package/@mysten/sui) SDK.

---

## Topics

### 1. Object Indexing for User Interfaces

> **Module:** [`01-object-indexing-ui`](./01-object-indexing-ui)

Explores the different strategies for discovering and indexing on-chain data from Sui dApps — objects, events, and transactions — using the available RPC interfaces.

#### Discovering Events

Query past events emitted by Sui smart contracts using multiple approaches:

- **By Package or Module** — Retrieve all events sent by a specific package or module via GraphQL RPC.
- **By Fully Qualified Type** — Filter events by their exact struct type (`package::module::struct`) via GraphQL RPC.
- **From a Transaction** — Extract and BCS-decode events from a specific transaction via gRPC.

#### Discovering Objects

Locate and inspect on-chain objects:

- **By Type** — Query objects matching a given type filter (`package`, `package::module`, or `package::module::struct`) via GraphQL RPC.
- **From a Transaction** — Inspect the effects of a transaction to find created, deleted, and mutated objects, with support for both gRPC and GraphQL RPC.

#### Discovering Transactions

Search for transactions using various filters:

- **By Package, Module, or Function** — Find transactions that invoked a specific package, module, or function via GraphQL RPC.
- **By Sender Address** — Find all transactions originating from a given address.
- **By Affected Address** — Find all transactions that affected a given address.

#### Real-Time Event Indexing

Subscribe to the Sui checkpoint stream via gRPC to listen for and decode events in real time. The indexer:

- Streams checkpoints using `subscribeCheckpoints` from the gRPC subscription service.
- Filters events by their fully qualified type.
- Decodes BCS-encoded event payloads using a known struct definition.
- Supports graceful cancellation via `AbortSignal`.

#### RPC Clients

The module demonstrates usage of three Sui RPC interfaces:

| Client | Protocol | Status | Use Cases |
|---|---|---|---|
| `SuiGraphQLClient` | GraphQL | **Current** | Querying objects, events, and transactions |
| `SuiGrpcClient` | gRPC | **Current** | Transaction lookups, real-time subscriptions |
| `SuiJsonRpcClient` | JSON-RPC | **Deprecated** | Legacy reference only |

---

### 2. Upgradeability

WIP

---

### 3. Performance and Benchmarking

WIP

---

### 4. Design Decisions

WIP

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- Node.js 18+ (optional, for tooling compatibility)
