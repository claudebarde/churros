import { writable } from "svelte/store";
import type { TezosContractAddress } from "./types";

const initialState: {
  [p in TezosContractAddress]: {
    origination: { level: number; storage: any };
    updates: Array<any>;
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
  reset: () => {
    store.update(_ => {
      //window.sessionStorage.removeItem(sessionStoreName);
      return {};
    });
  }
};

export default state;
