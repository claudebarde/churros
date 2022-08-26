import { writable } from "svelte/store";
import type { TezosContractAddress, ContractUpdateData } from "./types";

const initialState: {
  [p in TezosContractAddress]: {
    origination: { level: number; storage: any };
    updates: Array<ContractUpdateData>;
  };
} = {};
const store = writable(initialState);

const state = {
  subscribe: store.subscribe,
  addNewContract: (address: TezosContractAddress, level: number) =>
    store.update(store => {
      const newStore = {
        ...store,
        [address]: { origination: { level, storage: null }, updates: [] }
      };
      //window.sessionStorage.setItem(sessionStoreName, JSON.stringify(newStore));

      return newStore;
    }),
  addNewUpdate: (updates: Array<ContractUpdateData>) => {
    store.update(store => {
      console.log({ updates });
      updates.forEach(update => {
        if (store.hasOwnProperty(update.address)) {
          store[update.address].updates.push(update);
        }
      });
      return store;
    });
  },
  reset: () => {
    store.update(_ => {
      //window.sessionStorage.removeItem(sessionStoreName);
      return {};
    });
  }
};

export default state;
