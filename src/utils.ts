import { get } from "svelte/store";
import type { BlockResponse } from "@taquito/rpc";
import { OpKind, type TezosToolkit } from "@taquito/taquito";
import { validateAddress } from "@taquito/utils";
import type {
  OriginationData,
  TransactionData,
  ContractUpdateData,
  TezosContractAddress
} from "./types";
import contractsStore from "./contractsStore";

const objHasProperty = (obj: any, property: string): boolean => {
  return (
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    obj !== null &&
    obj.hasOwnProperty(property)
  );
};

const shortenHash = (hash: string, length_?: number): string => {
  const length = length_ ? length_ : 7;
  return hash ? hash.slice(0, length) + "..." + hash.slice(-length) : "";
};

const isString = (val: any): boolean => typeof val === "string";
const isNumber = (val: any): boolean =>
  typeof +val === "number" && !isNaN(+val);

const checkForOriginationOps = (
  block: BlockResponse
): Array<OriginationData> => {
  // looks for origination ops
  const originations: Array<OriginationData> = [];
  block.operations.forEach(ops => {
    if (ops.length > 0) {
      ops.forEach(op => {
        if (op.contents.length > 0) {
          op.contents.forEach(_op => {
            if (_op.kind === OpKind.ORIGINATION) {
              const address = (_op as any).metadata.operation_result
                .originated_contracts[0];
              originations.push({ address, level: block.header.level });
            }
          });
        }
      });
    }
  });
  return originations;
};

const findNewTransactions = (block: BlockResponse): Array<TransactionData> => {
  return block.operations
    .map(arrOp =>
      arrOp.map(op => ({
        hash: op.hash,
        level: block.header.level,
        block: block.hash
      }))
    )
    .flat();
};

const json2html = (json: any): string => {
  const padding = "padding:5px 0px 0px 20px";

  if (json && Array.isArray(json)) {
    // JSON array
    if (json.length === 0) {
      return `<div>[]</div>`;
    }

    return `<div>[ <div style="${padding}">${json
      .map(el => json2html(el))
      .join("")}</div> ]</div>`;
  } else if (json && typeof json === "object" && !Array.isArray(json)) {
    // JSON object
    return `<div>{ ${Object.entries(json)
      .map(
        ([name, el]) =>
          `<div style="${padding}"><span>${name}</span>: ${json2html(el)}</div>`
      )
      .join("")} }</div>`;
  } else {
    //other JSON value
    if (json === undefined) {
      return "undefined";
    } else if (json === null) {
      return "null";
    } else if (typeof json === "boolean") {
      return json ? "true" : "false";
    } else {
      if (validateAddress(json) === 3) {
        // account address
        return `<a hrel="#/accounts/${json}">${json}</a>`;
      }

      return json.toString();
    }
  }
};

const findContractUpdates = async (
  blockHash: string,
  Tezos: TezosToolkit,
  availableContracts: Array<TezosContractAddress>
): Promise<Array<ContractUpdateData>> => {
  const blockData = await Tezos.rpc.getBlock({ block: blockHash });
  // loads the transaction data
  return blockData.operations
    .filter(opsArray => opsArray.length > 0)
    .map(opsArray =>
      opsArray
        .filter(txsArray => txsArray.contents.length > 0)
        .map(txsArray =>
          txsArray.contents.filter(tx => tx.kind === "transaction")
        )
    )
    .filter(el => el && el.length > 0)
    .flat(Infinity)
    .filter(tx => availableContracts.includes((tx as any).destination))
    .map(
      (tx: any) =>
        ({
          blockHash,
          level: +blockData.header.level,
          fee: +tx.fee,
          gasLimit: +tx.gas_limit,
          storageLimit: +tx.storage_limit,
          storageSize: +tx.metadata.operation_result.storage_size,
          address: tx.destination,
          consumedMilligas: +tx.metadata.operation_result.consumed_milligas,
          status: tx.metadata.operation_result.status,
          parameters: {
            entrypoint: tx.parameters.entrypoint,
            value: tx.parameters.value
          }
        } as ContractUpdateData)
    );
};

export default {
  objHasProperty,
  shortenHash,
  isString,
  isNumber,
  checkForOriginationOps,
  findNewTransactions,
  json2html,
  findContractUpdates
};
