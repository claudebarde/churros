import { writable } from "svelte/store";
import { State, Protocol, TransactionData } from "./types";
import type { TezosToolkit } from "@taquito/taquito";
import type { BlockResponse } from "@taquito/rpc";

const initialState: State = {
  status: "unknown",
  Tezos: undefined,
  currentView: "dashboard",
  blockTime: 5,
  blocks: [],
  chainDetails: { chainId: undefined, protocolHash: undefined },
  currentLevel: undefined,
  blockchainProtocol: Protocol.JAKARTA,
  transactions: []
};

const store = writable(initialState);

const state = {
  subscribe: store.subscribe,
  updateStatus: (newStatus: State["status"]) =>
    store.update(store => ({ ...store, status: newStatus })),
  updateTezos: (tezos: TezosToolkit) =>
    store.update(store => ({ ...store, Tezos: tezos })),
  updateView: (view: State["currentView"]) =>
    store.update(store => ({ ...store, currentView: view })),
  updateBlockTime: (blockTime: number) =>
    store.update(store => ({ ...store, blockTime })),
  addNewBlock: (block: BlockResponse) =>
    store.update(store => {
      // checks if block hasn't been added yet
      if (
        store.blocks &&
        !store.blocks.find(_block => _block.hash === block.hash)
      ) {
        if (store.blocks.length < 100) {
          return {
            ...store,
            blocks: [
              {
                hash: block.hash,
                level: block.header.level,
                chainId: block.chain_id,
                timestamp: block.header.timestamp as string,
                operationsCount: block.operations.length
              },
              ...store.blocks
            ]
          };
        } else {
          // remove the last element of the array
          store.blocks.pop();

          return {
            ...store,
            blocks: [
              {
                hash: block.hash,
                level: block.header.level,
                chainId: block.chain_id,
                timestamp: block.header.timestamp as string,
                operationsCount: block.operations.length
              },
              ...store.blocks
            ]
          };
        }
      }
    }),
  resetBlocks: () => store.update(store => ({ ...store, blocks: [] })),
  updateChainDetails: ({ chainId, protocolHash }: State["chainDetails"]) => {
    store.update(store => ({
      ...store,
      chainDetails: { chainId, protocolHash }
    }));
  },
  updateCurrentLevel: (level: number) =>
    store.update(store => ({ ...store, currentLevel: level })),
  updateBlockchainProtocol: (protocol: Protocol) =>
    store.update(store => ({ ...store, blockchainProtocol: protocol })),
  addNewTransactions: (transactions: Array<TransactionData>) =>
    store.update(store => {
      if (store.transactions && store.transactions.length < 100) {
        return {
          ...store,
          transactions: [...transactions, ...store.transactions]
        };
      } else {
        // remove the last element of the array
        const newTxsStore = store.transactions.slice(transactions.length);

        return { ...store, transactions: [...transactions, ...newTxsStore] };
      }
    })
};

export default state;
