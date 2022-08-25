<script lang="ts">
  import { fly } from "svelte/transition";
  import { backInOut } from "svelte/easing";
  import { validateContractAddress } from "@taquito/utils";
  import store from "../../store";

  // Handles different click events on the toast
  const clickToast = event => {
    const link = event.target.href;
    if (link) {
      // determines if the link is to a contract address
      const regex = /\/contracts\/(KT1[a-zA-Z0-9]{33})/;
      const match = link.match(regex);
      if (match && validateContractAddress(match[1]) === 3) {
        store.updateView("contracts", match[1]);
      }
    } else {
      console.log("not a link");
    }
  };
</script>

<style lang="scss">
  @import "../../styles/settings.scss";

  .toast {
    position: absolute;
    bottom: 5%;
    left: 50%;
    transform: translate(-50%, -5%);
    padding: 20px;
    background-color: lighten($yellow, 20);
    width: 30%;
    border: solid 3px $dark-orange;
    border-radius: 10px;
    text-align: center;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>

{#if $store.toast.showToast}
  <div
    class="toast"
    transition:fly={{ duration: 1000, y: 300, opacity: 1, easing: backInOut }}
    on:click={clickToast}
  >
    {#if $store.toast.toastType === "success"}
      <span class="material-symbols-outlined"> thumb_up </span>
    {:else if $store.toast.toastType === "error"}
      <span class="material-symbols-outlined"> thumb_down </span>
    {:else if $store.toast.toastType === "info"}
      <span class="material-symbols-outlined"> info </span>
    {/if}
    <span>{@html $store.toast.toastText}</span>
    <span />
  </div>
{/if}
