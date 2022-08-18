<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import store from "../../store";
  import contractsStore from "../../contractsStore";
  import utils from "../../utils";
  import ContractIcon from "../Icons/ContractIcon.svelte";
  import type { TezosContractAddress } from "../../types";

  let selectedContract;
  let selectedContractData;
  let selectedContractStorage;

  const loadContract = async (contractAddress: TezosContractAddress) => {
    selectedContract = contractAddress;
    selectedContractData = $contractsStore[contractAddress];
    const contract = await $store.Tezos.contract.at(contractAddress);
    selectedContractStorage = await contract.storage();
  };

  onMount(async () => {
    if ($store.viewParams) {
      loadContract($store.viewParams);
    }
  });
</script>

<div class="data-display-container">
  <div class="data-display-menu">
    {#if selectedContract}
      <button class="primary selected-data-display" disabled>
        <ContractIcon color="white" width={24} height={24} amount={undefined} />
        {utils.shortenHash(selectedContract)}
      </button>
      <div class="separator" />
    {/if}
    <div
      class="data-display-list"
      style={selectedContract ? "height:90%" : "height:100%"}
    >
      {#each Object.entries($contractsStore) as [contractAddress, contractData]}
        <button
          class="primary"
          transition:fly|local={{ duration: 300, y: -300 }}
          on:click={async () => {
            loadContract(contractAddress);
          }}
        >
          <ContractIcon
            color={contractAddress === selectedContract ? "white" : "#834112"}
            width={24}
            height={24}
            amount={undefined}
          />
          {utils.shortenHash(contractAddress)} (level {contractData.origination
            .level})
        </button>
      {:else}
        <div>No contract to show</div>
      {/each}
    </div>
  </div>
  <div class="block-details-container">
    <div class="general-container data-display-details">
      {#if selectedContract && selectedContractData && selectedContractStorage}
        <h3>Contract {selectedContract}</h3>
        <div>Originated at level {selectedContractData.origination.level}</div>
        <div>
          <pre>{JSON.stringify(selectedContractStorage, null, 2)}</pre>
        </div>
      {/if}
    </div>
  </div>
</div>
