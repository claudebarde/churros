import type { BlockResponse } from "@taquito/rpc";
import { OpKind } from "@taquito/taquito";
import { validateAddress } from "@taquito/utils";
import type { OriginationData, TransactionData } from "./types";

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
      arrOp.map(op => ({ hash: op.hash, level: block.header.level }))
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

export default {
  objHasProperty,
  shortenHash,
  isString,
  isNumber,
  checkForOriginationOps,
  findNewTransactions,
  json2html
};
