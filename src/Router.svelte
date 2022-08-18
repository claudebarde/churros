<script lang="ts">
  import store from "./store";
  import Dashboard from "./lib/Dashboard/Dashboard.svelte";
  import Accounts from "./lib/Accounts.svelte";
  import Blocks from "./lib/Blocks.svelte";
  import Transactions from "./lib/Transactions.svelte";
  import Contracts from "./lib/Contracts/Contracts.svelte";
  import Settings from "./lib/Settings/Settings.svelte";
</script>

{#if $store.currentView === "dashboard"}
  <Dashboard />
{:else if $store.currentView === "accounts"}
  <Accounts />
{:else if $store.currentView === "blocks"}
  <Blocks />
{:else if $store.currentView === "transactions"}
  <Transactions />
{:else if $store.currentView === "contracts"}
  <Contracts />
{:else if $store.currentView === "settings"}
  <Settings />
{:else if $store.currentView === "notfound"}
  <div>Not found</div>
{/if}
