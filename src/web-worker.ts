import { TezosToolkit, PollingSubscribeProvider } from "@taquito/taquito";
import { Protocol, TezosContractAddress } from "./types";
import utils from "./utils";
import config from "./config";

const ctx: Worker = self as any;
const availableContracts: Array<TezosContractAddress> = [];

ctx.onmessage = async ev => {
  const msg = ev.data;
  if (msg.type === "init") {
    const { blockTime, blocks } = msg.payload;
    const Tezos = new TezosToolkit(
      `${config.flextesaUrl}:${config.flextesaPort}`
    );
    const header = await Tezos.rpc.getBlockHeader();
    // chain_id
    if (utils.objHasProperty(header, "chain_id")) {
      ctx.postMessage({
        type: "store-update",
        update: "updateChainDetails",
        payload: { chainId: header.chain_id }
      });
    }
    // protocol hash
    if (utils.objHasProperty(header, "protocol")) {
      ctx.postMessage({
        type: "store-update",
        update: "updateChainDetails",
        payload: { protocolHash: header.protocol }
      });
    }
    // current level
    if (utils.objHasProperty(header, "level")) {
      ctx.postMessage({
        type: "store-update",
        update: "updateCurrentLevel",
        payload: header.level
      });
    } else {
      ctx.postMessage({
        type: "store-update",
        update: "updateCurrentLevel",
        payload: undefined
      });
    }
    // updates Taquito polling interval
    Tezos.setStreamProvider(
      Tezos.getFactory(PollingSubscribeProvider)({
        pollingIntervalMilliseconds: blockTime * 1000
      })
    );
    // subscribes to new blocks
    const subscriber = Tezos.stream.subscribe("head");
    subscriber.on("data", async blockHash => {
      ctx.postMessage({
        type: "store-update",
        update: "updateStatus",
        payload: "running"
      });
      const block = await Tezos.rpc.getBlock({ block: blockHash });
      // validates block properties
      const validBlockProperties = [
        "chain_id",
        "hash",
        "header",
        "metadata",
        "operations",
        "protocol"
      ];
      if (
        validBlockProperties
          .map(prop => utils.objHasProperty(block, prop))
          .reduce((a, b) => a && b)
      ) {
        // validates protocol
        const protocol = block.metadata.protocol;
        if (protocol.includes("ithaca")) {
          ctx.postMessage({
            type: "store-update",
            update: "updateBlockchainProtocol",
            payload: Protocol.ITHACA
          });
        } else if (protocol.includes("hangz")) {
          ctx.postMessage({
            type: "store-update",
            update: "updateBlockchainProtocol",
            payload: Protocol.HANGZHOU
          });
        } else if (protocol.includes("granada")) {
          ctx.postMessage({
            type: "store-update",
            update: "updateBlockchainProtocol",
            payload: Protocol.GRANADA
          });
        } else if (protocol.includes("kathmandu")) {
          ctx.postMessage({
            type: "store-update",
            update: "updateBlockchainProtocol",
            payload: Protocol.KATHMANDU
          });
        }
        // calculates actual block time
        if (blocks.length > 0) {
          const lastBlockTimestamp = new Date(
            blocks[0].header.timestamp
          ).getTime();
          const newBlockTimestamp = new Date(block.header.timestamp).getTime();
          const actualBlockTime = newBlockTimestamp - lastBlockTimestamp;
          ctx.postMessage({
            type: "store-update",
            update: "updateBlockTime",
            payload: actualBlockTime / 1000
          });
          if (actualBlockTime > 120_000) {
            // shows idle status
            ctx.postMessage({
              type: "store-update",
              update: "updateChainStatus",
              payload: "idle"
            });
          }
        }
        // saves new block
        // TODO: for now, saved locally, but database should be set
        ctx.postMessage({
          type: "store-update",
          update: "addNewBlock",
          payload: block
        });
        // updates level
        if (utils.objHasProperty(block.header, "level")) {
          ctx.postMessage({
            type: "store-update",
            update: "updateCurrentLevel",
            payload: block.header.level
          });
        }
        // checks for contract origination
        const newOriginations = utils.checkForOriginationOps(block);
        if (newOriginations.length > 0) {
          const address = newOriginations[0].address;
          availableContracts.push(address);
          ctx.postMessage({
            type: "contracts-update",
            update: "addNewContract",
            payload: [address, newOriginations[0].level]
          });
        }
        // finds new transactions
        const newTransactions = utils.findNewTransactions(block);
        if (newTransactions.length > 0) {
          ctx.postMessage({
            type: "store-update",
            update: "addNewTransactions",
            payload: newTransactions
          });
          // checks contract updates
          const contractUpdates = await utils.findContractUpdates(
            blockHash,
            Tezos,
            availableContracts
          );
          if (contractUpdates.length > 0) {
            ctx.postMessage({
              type: "contracts-update",
              update: "addNewUpdate",
              payload: contractUpdates
            });
          }
        }
      }
    });
    subscriber.on("error", err => {
      if (err.name && err.name === "HttpRequestFailed") {
        // Flextesa is probably not running anymore
        ctx.postMessage({
          type: "store-update",
          update: "reset",
          payload: undefined
        });
      }
    });
    subscriber.off("error", err => {
      console.error("Taquito subscriber error:", err);
    });
    subscriber.on("close", () => {
      console.log("Taquito subscriber closed");
    });
  }
};

export {};
