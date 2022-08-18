<script lang="ts">
  import store from "../store";
</script>

<style lang="scss">
  @import "../styles/settings.scss";

  header {
    background-color: $black;
    color: white;
    border-bottom: solid 2px $yellow;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 20px;

    & > button {
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      background-color: transparent;
      color: white;
      font-size: inherit;
      cursor: pointer;

      & > span {
        margin: 0px 3px;
      }
    }

    span.material-symbols-outlined.active {
      color: $orange;
    }
  }
</style>

<header>
  <button on:click={() => store.updateView("dashboard")}>
    <span
      class="material-symbols-outlined"
      class:active={$store.currentView === "dashboard"}
    >
      team_dashboard
    </span>
    <span>Dashboard</span>
  </button>
  <button on:click={() => store.updateView("accounts")}>
    <span
      class="material-symbols-outlined"
      class:active={$store.currentView === "accounts"}
    >
      group
    </span>
    <span>Accounts</span>
  </button>
  <button on:click={() => store.updateView("blocks")}>
    <span
      class="material-symbols-outlined"
      class:active={$store.currentView === "blocks"}
    >
      grid_view
    </span>
    <span>Blocks</span>
  </button>
  <button on:click={() => store.updateView("transactions")}>
    <span
      class="material-symbols-outlined"
      class:active={$store.currentView === "transactions"}
    >
      sync_alt
    </span>
    <span>Transactions</span>
  </button>
  <button on:click={() => store.updateView("contracts")}>
    <span
      class="material-symbols-outlined"
      class:active={$store.currentView === "contracts"}
    >
      receipt_long
    </span>
    <span>Contracts</span>
  </button>
  <button on:click={() => store.updateView("settings")}>
    <span
      class="material-symbols-outlined"
      class:active={$store.currentView === "settings"}
    >
      settings
    </span>
    <span>Settings</span>
  </button>
</header>
