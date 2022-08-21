<script lang="ts">
  import { onMount } from "svelte";
  import config from "../config";
  import store from "../store";

  let aliceBalance: null | number = null;
  let bobBalance: null | number = null;

  onMount(async () => {
    if ($store.Tezos) {
      const aliceBalance_ = await $store.Tezos.tz.getBalance(
        config.accounts.alice.pkh
      );
      if (aliceBalance_) {
        aliceBalance = aliceBalance_.toNumber();
      }

      const bobBalance_ = await $store.Tezos.tz.getBalance(
        config.accounts.bob.pkh
      );
      if (bobBalance_) {
        aliceBalance = bobBalance_.toNumber();
      }
    }
  });
</script>

<style lang="scss">
  .accounts {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 20px;
    font-size: 1.1rem;
    height: calc(100% - 40px);
    overflow: auto;

    .account {
      width: 50%;
      margin: 40px;
      text-align: center;

      & > div {
        padding: 10px;
      }
    }
  }
</style>

<div class="accounts">
  <h1 class="title">Available accounts</h1>
  <div class="general-container account">
    <div style="font-weight:bold">
      Alice {aliceBalance
        ? `(${(aliceBalance / 10 ** 6 / 1).toLocaleString("en-US")} tez)`
        : ""}
    </div>
    <div>
      <div>Public key hash</div>
      <div>{config.accounts.alice.pkh}</div>
    </div>
    <div>
      <div>Public key</div>
      <div>{config.accounts.alice.pk}</div>
    </div>
    <div>
      <div>Secret key</div>
      <div>{config.accounts.alice.sk}</div>
    </div>
  </div>
  <div class="general-container account">
    <div style="font-weight:bold">
      Bob {bobBalance ? `(${bobBalance / 10 ** 6 / 1}) tez)` : ""}
    </div>
    <div>
      <div>Public key hash</div>
      <div>{config.accounts.bob.pkh}</div>
    </div>
    <div>
      <div>Public key</div>
      <div>{config.accounts.bob.pk}</div>
    </div>
    <div>
      <div>Secret key</div>
      <div>{config.accounts.bob.sk}</div>
    </div>
  </div>
</div>
