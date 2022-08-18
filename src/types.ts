import type { TezosToolkit } from "@taquito/taquito";

export interface Block {
  hash: string;
  level: number;
  chainId: string;
  timestamp: string;
  operationsCount: number;
}

export type State = {
  status: "off" | "running" | "unknown";
  Tezos: TezosToolkit;
  currentView:
    | "dashboard"
    | "accounts"
    | "blocks"
    | "transactions"
    | "contracts"
    | "settings"
    | "notfound";
  viewParams: any;
  blockTime: number;
  blocks: Array<Block>;
  chainDetails: {
    chainId: string | undefined;
    protocolHash: string | undefined;
  };
  currentLevel: number;
  blockchainProtocol: Protocol;
  transactions: Array<TransactionData>;
  toast: {
    showToast: boolean;
    toastText: string;
  };
};

export enum Protocol {
  JAKARTA = "jakarta",
  HANGZHOU = "hangzhou",
  ITHACA = "ithaca",
  GRANADA = "granada",
  ALPHA = "alpha"
}

export interface OriginationData {
  address: TezosContractAddress;
  level: number;
}

export type TransactionData = { hash: string; level: number };

export type TezosContractAddress = `KT1${string}`;
export type TezosAccountAddress = `tz${"1" | "2" | "3"}${string}`;

export interface ContractSessionStorage {
  [p: TezosContractAddress]: {
    origination: {
      level: number;
      storage: any;
    };
    updates: Array<{
      level: number;
      previousStorage: any;
      currentStorage: any;
    }>;
  };
}
