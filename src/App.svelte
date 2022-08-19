<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { TezosToolkit } from "@taquito/taquito";
  import { InMemorySigner } from "@taquito/signer";
  import store from "./store";
  import contractsStore from "./contractsStore";
  import Header from "./lib/Header.svelte";
  import Subheader from "./lib/Subheader.svelte";
  import Router from "./Router.svelte";
  import Footer from "./lib/Footer.svelte";
  import config from "./config";
  import WebWorker from "./web-worker?worker";
  import Toast from "./lib/components/Toast.svelte";

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
          store.updateBlockchainProtocol(config.defaultProtocol);
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
          contractsStore[data.update](...data.payload);
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
    // sets up the signer
    const signer = new InMemorySigner(config.accounts.alice.sk);
    Tezos.setSignerProvider(signer);
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
      }
    } catch (error) {
      // Flextesa is probably not launched
      store.updateStatus("off");
    }
  });

  afterUpdate(() => {
    // relistens to Flextesa coming online after shut off
    if (checkFlextesaInterval === undefined && $store.status === "off") {
      checkFlextesaInterval = setInterval(async () => {
        console.log("flextesa interval");
        const header = await $store.Tezos.rpc.getBlockHeader();
        if (header) {
          // Blockchain is online
          initWebWorker();
        }
      }, 2000);
    }
  });
</script>

<Toast />
<Header />
<Subheader />
<main>
  <Router />
</main>
<Footer />
