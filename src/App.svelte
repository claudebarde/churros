<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { TezosToolkit } from "@taquito/taquito";
  import store from "./store";
  import Header from "./lib/Header.svelte";
  import Subheader from "./lib/Subheader.svelte";
  import Router from "./Router.svelte";
  import Footer from "./lib/Footer.svelte";
  import config from "./config";
  import WebWorker from "./web-worker?worker";
  import { Protocol } from "./types";

  let checkFlextesaInterval;

  const initWebWorker = () => {
    clearInterval(checkFlextesaInterval);
    checkFlextesaInterval = undefined;

    const webWorker = new WebWorker();
    webWorker.postMessage({
      type: "init",
      payload: {
        blockTime: $store.blockTime,
        blocks: $store.blocks
      }
    });
    webWorker.onmessage = msg => {
      const { data } = msg;
      if (data.type === "store-update") {
        if (data.update === "reset") {
          store.updateStatus("off");
          store.updateChainDetails({
            chainId: undefined,
            protocolHash: undefined
          });
          store.updateCurrentLevel(undefined);
          store.updateBlockchainProtocol(Protocol.HANGZHOU);
          store.resetBlocks();
          // contractsStore.reset();
        } else if (data.update === "updateChainDetails") {
          store[data.update]({ ...$store.chainDetails, ...data.payload });
        } else {
          // updates the store
          // console.log(data.update, store.hasOwnProperty(data.update));
          store[data.update](data.payload);
        }
      } else if (data.type === "contracts-update") {
        if (data.update === "addNewContract") {
          // contractsStore[data.update](...data.payload);
        }
      }
    };
    store.updateStatus("running");
  };

  onMount(async () => {
    // initializes the Tezos toolkit
    const Tezos = new TezosToolkit(
      `${config.flextesaUrl}:${config.flextesaPort}`
    );
    store.updateTezos(Tezos);
    // starts the web worker
    try {
      const header = await Tezos.rpc.getBlockHeader();
      if (header) {
        // Blockchain is online
        initWebWorker();
      } else {
        // Flextesa is probably not launched
        store.updateStatus("off");
        // sets an interval to check if Flextesa goes online
        checkFlextesaInterval = setInterval(async () => {
          const header = await Tezos.rpc.getBlockHeader();
          if (header) {
            // Blockchain is online
            initWebWorker();
          }
        }, 2000);
      }
    } catch (error) {
      // Flextesa is probably not launched
      store.updateStatus("off");
      checkFlextesaInterval = setInterval(async () => {
        const header = await Tezos.rpc.getBlockHeader();
        if (header) {
          // Blockchain is online
          initWebWorker();
        }
      }, 2000);
    }
  });

  afterUpdate(() => {
    // relistens to Flextesa coming online after shut off
    if (checkFlextesaInterval === undefined && $store.status === "off") {
      checkFlextesaInterval = setInterval(async () => {
        const header = await $store.Tezos.rpc.getBlockHeader();
        if (header) {
          // Blockchain is online
          initWebWorker();
        }
      }, 2000);
    }
  });
</script>

<Header />
<Subheader />
<main>
  <Router />
</main>
<Footer />
