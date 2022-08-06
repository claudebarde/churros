<script lang="ts">
  import store from "../store";
  import utils from "../utils";
  import config from "../config";
</script>

<style lang="scss">
  @import "../styles//settings.scss";

  header {
    background-color: $header-bg-color;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 20px;

    & > div {
      text-align: center;

      & div:last-child {
        color: $orange;
      }
    }
  }
</style>

<header>
  <div>
    <div>Chain status</div>
    <div>
      {#if $store.status === "off"}
        <span style="color:red">Not running</span>
      {:else if $store.status === "running"}
        <span style="color:lime">Running</span>
      {:else if $store.status === "unknown"}
        <span style="color:yellow">Unknown</span>
      {/if}
    </div>
  </div>
  {#if $store.status === "running"}
    <div>
      <div>Chain ID</div>
      <div>
        {$store.chainDetails.chainId}
      </div>
    </div>
    <div>
      <div>Protocol hash</div>
      <div>
        {utils.shortenHash($store.chainDetails.protocolHash)}
      </div>
    </div>
    <div>
      <div>Current level</div>
      <div>
        {$store.currentLevel}
      </div>
    </div>
    <div>
      <div>Block time</div>
      <div>
        {$store.blockTime} seconds
      </div>
    </div>
    <div>
      <div>RPC address</div>
      <div>{config.flextesaUrl}:{config.flextesaPort}</div>
    </div>
  {/if}
</header>
