<script lang="ts">
  import store from "../../store";
  import logo from "../../assets/churros.png";
  import Block from "./Block.svelte";
</script>

<style lang="scss">
  @import "../../styles/settings.scss";

  .container {
    height: 100%;
    display: grid;
    place-items: center;

    & > div {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 50%;
    }

    h1,
    h3 {
      text-align: center;
      margin: 10px;
      padding: 0px;
    }

    img.logo {
      width: 60%;
    }

    .blocks {
      padding: 10px 0px;
      height: calc(100% - 20px);
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      overflow: auto;
    }
  }
</style>

<div
  class="container"
  class:disconnected={$store.status !== "running"}
  class:connected={$store.status === "running"}
>
  {#if $store.status !== "running"}
    <div>
      <h1>Churros</h1>
      <img class="logo" src={logo} alt="churros-logo" />
      <h3>
        <span>A local blockchain explorer</span>
        <br />
        <span>to test Tezos smart contracts and dapps</span>
      </h3>
    </div>
  {:else}
    <div class="blocks">
      {#each $store.blocks as block (block.hash)}
        <Block {block} />
      {:else}
        <div>Blockchain is online</div>
      {/each}
    </div>
  {/if}
</div>
