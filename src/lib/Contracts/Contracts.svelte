<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { BigMapAbstraction } from "@taquito/taquito";
  import { Schema } from "@taquito/michelson-encoder";
  import { bytes2Char } from "@taquito/utils";
  import BigNumber from "bignumber.js";
  import store from "../../store";
  import contractsStore from "../../contractsStore";
  import utils from "../../utils";
  import ContractIcon from "../Icons/ContractIcon.svelte";
  import type { TezosContractAddress } from "../../types";

  let selectedContract;
  let selectedContractData;
  let selectedContractStorage: Array<{ name: string; value: any }> = [];
  let bigmapSearchResults = {};
  let entrypoints: Array<{ name: string }> = [];
  let contractCallValues = {};

  const findAnnotationType = (schema: any, annot: string): string | null => {
    if (
      schema.hasOwnProperty("prim") &&
      schema.prim === "pair" &&
      Array.isArray(schema.args)
    ) {
      let [res_a, res_b] = [
        findAnnotationType(schema.args[0], annot),
        findAnnotationType(schema.args[1], annot)
      ];
      if (res_a === null && res_b === null) {
        return null;
      } else if (res_a !== null && res_b !== null) {
        // this case should not happen
        console.error(
          "Cannot have two annotation results in 'findAnnotationType'"
        );
        return null;
      } else {
        return res_a === null ? res_b : res_a;
      }
    } else {
      if (
        schema.hasOwnProperty("prim") &&
        schema.hasOwnProperty("annots") &&
        Array.isArray(schema.annots)
      ) {
        if (schema.annots[0] === "%" + annot) {
          return schema.prim;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  };

  const parseStorage = async (contractAddress: string, storage: any) => {
    const script = await $store.Tezos.rpc.getScript(contractAddress);
    const storageSchema = Schema.fromRPCResponse({ script });

    if (storage instanceof BigMapAbstraction) {
      // if storage is a single bigmap
      selectedContractStorage = [{ name: "bigmap", value: storage.toString() }];
    } else if (BigNumber.isBigNumber(storage)) {
      // if storage is a single number
      selectedContractStorage = [
        { name: "default", value: storage.toNumber() }
      ];
    } else {
      Object.entries(storage).forEach(([name, value]) => {
        // bigmap
        if (value instanceof BigMapAbstraction) {
          value = "bigmap";
          bigmapSearchResults[name] = {
            search: "",
            result: undefined
          };
        }
        // set
        /*if (Array.isArray(value)) {
          value = `[ ${value.map(v => v)} ]`;
        }*/
        const valType = findAnnotationType(storageSchema.val, name);
        // potentially big number
        if (BigNumber.isBigNumber(value)) {
          // finds value type
          if (valType) {
            value = `${value.toNumber().toLocaleString()} (${valType})`;
          } else {
            value = value.toNumber().toLocaleString();
          }
        } else if (valType === "bytes" && typeof value === "string") {
          value = `${bytes2Char(value)} (bytes)`;
        }

        const entry = { name, value };
        selectedContractStorage = [entry, ...selectedContractStorage];
        console.log(selectedContractStorage);
      });
    }
  };

  const searchBigMap = async (bigmapName: string) => {
    if (bigmapSearchResults.hasOwnProperty(bigmapName)) {
      const contract = await $store.Tezos.contract.at(selectedContract);
      const contractStorage = await contract.storage();
      const { search } = bigmapSearchResults[bigmapName];
      let bigmapKey;
      if (search.includes("/")) {
        // creates a pair for the bigmap key
        const pairItems = search.split("/");
        bigmapKey = { 0: pairItems[0], 1: pairItems[1] };
      } else {
        bigmapKey = search;
      }
      const result = await contractStorage[bigmapName].get(bigmapKey);
      if (result && BigNumber.isBigNumber(result)) {
        bigmapSearchResults[bigmapName].result = result.toNumber();
      } else if (result && !BigNumber.isBigNumber(result)) {
        bigmapSearchResults[bigmapName].result = JSON.stringify(result);
      } else {
        bigmapSearchResults[bigmapName].result = "no result";
      }
    }
  };

  const loadContract = async (contractAddress: TezosContractAddress) => {
    selectedContract = contractAddress;
    selectedContractData = $contractsStore[contractAddress];
    try {
      const contract = await $store.Tezos.contract.at(contractAddress);
      const contractStorage = await contract.storage();
      parseStorage(contractAddress, contractStorage);
      entrypoints = [
        ...Object.keys(contract.entrypoints.entrypoints)
          .map(key => ({
            name: key
          }))
          .sort((a, b) => {
            return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
          })
      ];
    } catch (error) {
      console.error(error);
      store.updateToast({
        showToast: true,
        toastType: "error",
        toastText: "Cannot load contract storage"
      });
    }
  };

  const makeContractCall = async (entrypointName: string) => {
    try {
      const contract = await $store.Tezos.contract.at(selectedContract);
      const op = await contract.methods[entrypointName](
        contractCallValues[entrypointName]
      ).send();
      store.updateToast({
        showToast: true,
        toastType: "info",
        toastText: "Operation injected, waiting for confirmation..."
      });
      await op.confirmation();
      loadContract(selectedContract);
      store.updateToast({
        showToast: true,
        toastType: "success",
        toastText: "Operation confirmed!"
      });
      contractCallValues = {};
    } catch (error) {
      console.error(error);
      store.updateToast({
        showToast: true,
        toastType: "error",
        toastText: "An error occurred, the operation couldn't be injected"
      });
    }
  };

  onMount(async () => {
    if ($store.viewParams) {
      loadContract($store.viewParams);
    }
  });
</script>

<style lang="scss">
  .contract-details-container {
    $v-padding: 30px;
    padding: $v-padding 40px;
    height: calc(100% - #{$v-padding} * 2);
    overflow: auto;

    .contract-updates-list {
      li > p {
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }
    }
  }
</style>

<div class="data-display-container">
  <div class="data-display-menu">
    {#if selectedContract && Object.entries($contractsStore).find(([addr, _]) => addr === selectedContract)}
      <button class="primary selected-data-display" disabled>
        <ContractIcon color="white" width={24} height={24} amount={undefined} />
        {utils.shortenHash(selectedContract)} (level {Object.entries(
          $contractsStore
        ).find(([addr, _]) => addr === selectedContract)[1].origination.level})
      </button>
      <div class="separator" />
    {/if}
    <div
      class="data-display-list"
      style={selectedContract &&
      Object.entries($contractsStore).find(
        ([address, _]) => address === selectedContract
      )
        ? "height:90%"
        : "height:100%"}
    >
      {#each Object.entries($contractsStore).reverse() as [contractAddress, data] (contractAddress)}
        <button
          class="primary"
          transition:fly|local={{ duration: 300, y: -300 }}
          on:click={async () => {
            selectedContract = contractAddress;
            loadContract(contractAddress);
          }}
        >
          <ContractIcon
            color={contractAddress === selectedContract ? "white" : "#834112"}
            width={24}
            height={24}
            amount={undefined}
          />
          {utils.shortenHash(contractAddress)} (level {data.origination.level})
        </button>
      {:else}
        <div>No contracts to display</div>
      {/each}
    </div>
  </div>
  <div class="contract-details-container">
    <div class="general-container data-display-details">
      {#if selectedContract && selectedContractStorage}
        <h3>Contract {selectedContract}</h3>
        <h4>- Entrypoints</h4>
        <div>
          {#each entrypoints as entrypoint}
            <div>
              <span class="material-symbols-outlined">
                keyboard_arrow_right
              </span>
              <span>
                {entrypoint.name}
              </span>
            </div>
            <div class="input-with-button" style="margin-left: 20px">
              <input
                type="text"
                placeholder="Contract call value"
                bind:value={contractCallValues[entrypoint.name]}
              />
              <button
                on:click={async () => await makeContractCall(entrypoint.name)}
              >
                Forge operation
              </button>
            </div>
          {/each}
        </div>
        <h4>- Storage</h4>
        <div>
          {#each selectedContractStorage as entry}
            <div class="data-display-details__info" style="margin-bottom:10px">
              <div>{entry.name}</div>
              <div>
                {#if entry.value === "bigmap"}
                  <div>big_map</div>
                  <div>Find a value by key:</div>
                  <div class="input-with-button">
                    <input
                      type="text"
                      placeholder="Big_map key"
                      bind:value={bigmapSearchResults[entry.name].search}
                    />
                    <button
                      on:click={async () => await searchBigMap(entry.name)}
                    >
                      Search
                    </button>
                  </div>
                  <div>
                    {#if bigmapSearchResults[entry.name] && bigmapSearchResults[entry.name].result}
                      {bigmapSearchResults[entry.name].result}
                    {:else}
                      &nbsp;
                    {/if}
                  </div>
                {:else if Array.isArray(entry.value)}
                  {#each entry.value as item, index}
                    <div>{index}- {item}</div>
                  {/each}
                {:else if typeof entry.value === "object" && Object.keys(entry.value).length > 0}
                  {JSON.stringify(entry.value, null, 2)}
                {:else}
                  {entry.value}
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <h4>- Updates</h4>
        <div>
          <ol reversed class="contract-updates-list">
            {#each $contractsStore[selectedContract].updates.reverse() as update, index}
              <li>
                <p>
                  At level {update.level}
                  <button
                    class="primary small"
                    on:click={() =>
                      store.updateView("blocks", update.blockHash)}
                  >
                    Inspect block
                  </button>
                </p>
                <p>
                  Entrypoint called:
                  <u>{update.parameters.entrypoint}</u>
                </p>
              </li>
            {:else}
              <li><p>(No update yet)</p></li>
            {/each}
          </ol>
        </div>
      {:else if Object.keys($contractsStore).length > 0}
        <div>Select a contract to display its data</div>
      {:else}
        <div>No contract to display yet</div>
      {/if}
    </div>
  </div>
</div>
