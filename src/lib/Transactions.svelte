<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import store from "../store";
  import utils from "../utils";
  import TransactionIcon from "./Icons/TransactionIcon.svelte";

  export let params;

  let selectedTransaction = "";

  onMount(async () => {
    if (params.transaction) {
      selectedTransaction = params.transaction;
    }
  });
</script>

<style lang="scss">
</style>

<div class="data-display-container">
  <div class="data-display-menu">
    {#if selectedTransaction && $store.transactions.find(tx => tx.hash === selectedTransaction)}
      <button class="primary selected-data-display" disabled>
        <TransactionIcon color="white" width={24} height={24} />
        {utils.shortenHash(selectedTransaction)} (level {$store.transactions.find(
          tx => tx.hash === selectedTransaction
        ).level})
      </button>
      <div class="separator" />
    {/if}
    <div
      class="data-display-list"
      style={selectedTransaction &&
      $store.transactions.find(tx => tx.hash === selectedTransaction)
        ? "height:90%"
        : "height:100%"}
    >
      {#each $store.transactions as tx (tx.hash)}
        <button
          class="primary"
          transition:fly|local={{ duration: 300, y: -300 }}
          on:click={async () => {
            selectedTransaction = tx.hash;
            document
              .getElementById("transaction-details-container")
              .scrollIntoView();
          }}
        >
          <TransactionIcon
            color={tx.hash === selectedTransaction ? "white" : "#834112"}
            width={24}
            height={24}
          />
          {utils.shortenHash(tx.hash)} (level {tx.level})
        </button>
      {:else}
        <div>No transactions to display</div>
      {/each}
    </div>
  </div>
  <div id="transaction-details-container" class="data-display-details">
    {#if selectedTransaction}
      <h3>Transaction {selectedTransaction}</h3>
      <div>
        <pre>Transaction details (WIP)</pre>
      </div>
    {:else}
      <div>Select a transaction to display its data</div>
    {/if}
  </div>
</div>
