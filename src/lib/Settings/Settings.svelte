<script lang="ts">
  import { afterUpdate } from "svelte";
  import { MichelsonMap } from "@taquito/taquito";
  import { invoke } from "@tauri-apps/api/tauri";
  import config from "../../config";
  import store from "../../store";
  import contractsStore from "../../contractsStore";
  import utils from "../../utils";
  import Dropdown from "../components/Dropdown.svelte";
  import { Protocol } from "../../types";
  import mockHarbingerCode from "./mockHarbingerCode";

  let box = config.defaultBox;

  let mockHarbingerValues = "XTZ-USD=5.67;BTC-USD=45000;ETH-USD=2876";
  let originatingOracle = false;
  let originatingNewContract = false;
  let newContractCode = "";
  let newContractStorage = "";
  let launchingFlextesa = false;
  let stoppingFlextesa = false;

  /**
   * flextesa launch command:
   * docker run --rm --name jakarta-sandbox --detach -p 20000:20000 --env flextesa_node_cors_origin='*'
   * --env block_time=5 oxheadalpha/flextesa:20220510 jakartabox start --genesis random
   */

  let originatedContracts;

  const launchFlextesa = async () => {
    launchingFlextesa = true;
    try {
      const result = await invoke("launch_flextesa", {
        blockTime: 5,
        protocol: $store.blockchainProtocol,
        flextesaPort: config.flextesaPort,
        imageId: config.defaultImageId,
        flextesaBox: box
      });
      console.log({ result });
      setTimeout(() => (launchingFlextesa = false), 2000);
    } catch (error) {
      console.error(error);
      launchingFlextesa = false;
    }
  };

  const killFlextesa = async () => {
    stoppingFlextesa = true;
    try {
      const result = await invoke("kill_flextesa", {
        protocol: $store.blockchainProtocol
      });
      console.log(result);
      // clean up
      contractsStore.reset();

      setTimeout(() => (stoppingFlextesa = false), 2000);
    } catch (error) {
      console.error(error);
      stoppingFlextesa = false;
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!$store.toast.showToast) {
      const data = [
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" })
        })
      ];
      navigator.clipboard.write(data).then(
        function () {
          console.log("Copied to clipboard successfully!");
          store.updateToast({
            showToast: true,
            toastType: "success",
            toastText: "Command copied to clipboard"
          });
        },
        function () {
          console.error("Unable to write to clipboard. :-(");
        }
      );
    }
  };

  const originateMockHarbinger = async () => {
    originatingOracle = true;
    try {
      // parses input values
      const oracleValues = mockHarbingerValues
        .split(";")
        .filter(entry => {
          const regex = new RegExp("[A-Z]{3,}-[A-Z]{3,}=[0-9\\.]*");
          return regex.test(entry);
        })
        .map(entry => entry.split("="));
      // originates the oracle
      if (oracleValues.length > 0) {
        const storage = new MichelsonMap();
        oracleValues.forEach(val => {
          if (!isNaN(+val[1])) {
            storage.set(val[0], {
              0: new Date().toISOString(),
              1: Math.round(+val[1] * 10 ** 6)
            });
          }
        });

        const originateOp = await $store.Tezos.contract.originate({
          code: mockHarbingerCode,
          storage
        });
        await originateOp.confirmation();
        store.updateToast({
          showToast: true,
          toastType: "success",
          toastText: "Mock Harbinger successfully originated!"
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      originatingOracle = false;
    }
  };

  const originateNewContract = async () => {
    // creates the storage needed by Taquito
    const [storage, isValidJson] = (() => {
      try {
        return [JSON.parse(newContractStorage.trim()), true];
      } catch (error) {
        console.error(error);
        return ["", false];
      }
    })();
    if (!isValidJson) {
      store.updateToast({
        showToast: true,
        toastType: "error",
        toastText: "Invalid JSON provided for storage"
      });
      return;
    } else {
      // formats the provided value to fit Taquito format
      const findMaps = storage => {
        if (typeof storage === "object" && !Array.isArray(storage)) {
          // value is an object
          let emptyStorage = {};

          Object.entries(storage).forEach(([key, value]: Array<any>) => {
            if (
              typeof value === "object" &&
              value.hasOwnProperty("type") &&
              value.hasOwnProperty("value") &&
              ["map", "big_map"].includes(value.type) &&
              Array.isArray(value.value)
            ) {
              if (value.value.length === 0) {
                // empty map/big_map
                emptyStorage[key] = new MichelsonMap();
              } else {
                const map = new MichelsonMap();
                // populates the map/big_map
                value.value.forEach(([key, value]) => {
                  if (!isNaN(+key)) {
                    // Taquito requires a string here
                    key = key.toString();
                  }

                  map.set(key, findMaps(value));
                });
                emptyStorage[key] = map;
              }
            } else if (
              typeof value === "object" &&
              !value.hasOwnProperty("type")
            ) {
              let emptyObj = {};
              const keyValuePairs = Object.entries(value);
              keyValuePairs.forEach(([key, val]) => {
                emptyObj[key] = findMaps(val);
              });
              emptyStorage[key] = emptyObj;
            } else {
              emptyStorage[key] = findMaps(value);
            }
          });

          return emptyStorage;
        } else {
          return storage;
        }
      };
      const formattedStorage = findMaps(storage);
      // prepares origination
      originatingNewContract = true;
      try {
        const originationOp = await $store.Tezos.contract.originate({
          code: newContractCode.trim(),
          storage: formattedStorage
        });
        await originationOp.confirmation();
        // displays new contract address
        store.updateToast({
          showToast: true,
          toastType: "success",
          toastText: `New contract: <a href="#/contracts/${
            originationOp.contractAddress
          }">${utils.shortenHash(originationOp.contractAddress)}</a>`,
          timeout: 6000
        });
        //TODO: saves the contract
      } catch (error) {
        console.error(error);
      } finally {
        originatingNewContract = false;
      }
    }
    /*
      {
        "ledger": {"type":"big_map", "value":[]},
        "operators": {"type":"big_map", "value":[]},
        "metadata": {"type":"big_map", "value":[[0, "5468697320697320612074657374"]]},
        "token_metadata": {"type":"big_map", "value":[ [0, { "token_id": 0, "token_info": {"type":"big_map", "value":[ ["", "5468697320697320612074657374"] ]} }] ]},
        "total_blogs": 0,
        "admin": "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
        "blogs": {"type":"big_map", "value":[]},
        "post_fee": {
          "5": 1000000,
          "6": 10000000
        },
        "token_rewards": 15000000,
        "total_supply": 0,
        "total_fees": 0
      }
      */
  };
</script>

<style lang="scss">
  @import "../../styles/settings.scss";

  .settings {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 20px;
    font-size: 1.1rem;
    height: calc(100% - 40px);
    overflow: auto;

    h3 {
      margin: 10px;
      font-size: 1.2rem;
      font-weight: bold;
      color: $black;
    }

    .setting {
      width: 50%;
      margin: 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      & > div {
        padding: 10px;
        width: 100%;
        display: flex;
        justify-content: space-around;
      }

      .reoriginate {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    .flextesa-settings {
      display: flex;
      justify-content: space-around;
      align-items: center;
      width: 100%;

      & > div {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      input[type="number"] {
        width: 80px;
      }
    }
  }
</style>

<div class="settings">
  <h1 class="title">Settings</h1>
  <div class="setting general-container">
    <h3>Launch Flextesa</h3>
    <div class="flextesa-settings">
      <div>
        <span>Protocol:</span>
        <Dropdown
          disabled={$store.status === "running"}
          selected={$store.blockchainProtocol}
          selection={Object.values(Protocol)}
          on:select={ev => {
            const protocol = ev.detail;
            store.updateBlockchainProtocol(ev.detail);
            switch (protocol) {
              case Protocol.JAKARTA:
                box = "jakartabox";
                break;
              case Protocol.HANGZHOU:
                box = "hangzbox";
                break;
              case Protocol.ITHACA:
                box = "ithacabox";
                break;
              case Protocol.GRANADA:
                box = "granabox";
                break;
              case Protocol.ALPHA:
                box = "alphabox";
                break;
            }
          }}
        />
      </div>
      <div>
        <span>Block time:</span>
        <input
          type="number"
          disabled={$store.status === "running"}
          value={$store.blockTime}
          on:change={ev => store.updateBlockTime(+ev.target.value)}
          on:input={ev => store.updateBlockTime(+ev.target.value)}
        />
      </div>
    </div>
    <div>
      <button
        class="primary"
        on:click={launchFlextesa}
        disabled={$store.status === "running"}
      >
        {#if launchingFlextesa}
          Launching...
        {:else}
          Launch
        {/if}
      </button>
    </div>
  </div>
  <div class="setting general-container">
    <h3>Stop Flextesa</h3>
    <div>
      <button
        class="primary"
        on:click={killFlextesa}
        disabled={$store.status === "off"}
      >
        {#if stoppingFlextesa}
          Stopping...
        {:else}
          Stop
        {/if}
      </button>
    </div>
  </div>
  <div class="setting general-container">
    <h3>Originate Mock Harbinger</h3>
    <div>
      Originate a contract that mimics Harbinger's Normalizer contract to fetch
      currency pair prices on-chain.
    </div>
    <div>
      <input type="text" style="width:70%" bind:value={mockHarbingerValues} />
    </div>
    <div>
      <button
        class="primary"
        on:click={originateMockHarbinger}
        disabled={$store.status === "off"}
      >
        {#if originatingOracle}
          Originating...
        {:else}
          Originate
        {/if}
      </button>
    </div>
  </div>
  {#if $originatedContracts && $originatedContracts.length > 0}
    <div class="setting general-container">
      <h3>Reoriginate a contract</h3>
      <div>Originate a contract that you originated before.</div>
      {#each $originatedContracts as contract, index}
        <div class="reoriginate">
          {index + 1}-
          <a href={`#/contracts/${contract.address}`}>
            {utils.shortenHash(contract.address)}
          </a>
          <button class="primary small"> Copy-paste below </button>
          <button class="primary small"> Delete </button>
        </div>
      {/each}
    </div>
  {/if}
  <div class="setting general-container">
    <h3>Originate a new contract</h3>
    <div>
      Originate a new contract by inputting the Michelson code and the storage
      below.
    </div>
    <div>
      <textarea
        placeholder="Michelson code"
        rows="10"
        style="width:70%"
        bind:value={newContractCode}
      />
    </div>
    <div>
      <textarea
        placeholder="Storage"
        rows="10"
        style="width:70%"
        bind:value={newContractStorage}
      />
    </div>
    <div>
      <button class="primary" on:click={originateNewContract}>
        {#if originatingNewContract}
          Originating...
        {:else}
          Originate
        {/if}
      </button>
    </div>
  </div>
</div>
