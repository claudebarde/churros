<script lang="ts">
  import store from "../store";
</script>

<style lang="scss">
  @import "../styles//settings.scss";

  header {
    background-color: $header-bg-color;
    color: white;
    border-bottom: solid 2px $bg-color;
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
  }
</style>

<header>
  <button on:click={() => store.updateView("dashboard")}>
    <span class="material-symbols-outlined"> team_dashboard </span>
    <span>Dashboard</span>
  </button>
  <button on:click={() => store.updateView("accounts")}>
    <span class="material-symbols-outlined"> group </span>
    <span>Accounts</span>
  </button>
  <button on:click={() => store.updateView("blocks")}>
    <span class="material-symbols-outlined"> grid_view </span>
    <span>Blocks</span>
  </button>
  <button on:click={() => store.updateView("transactions")}>
    <span class="material-symbols-outlined"> sync_alt </span>
    <span>Transactions</span>
  </button>
  <button on:click={() => store.updateView("settings")}>
    <span class="material-symbols-outlined"> settings </span>
    <span>Settings</span>
  </button>
</header>
