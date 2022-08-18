<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { OpKind } from "@taquito/taquito";
  import contractsStore from "../../contractsStore";
  import CubeIcon from "../Icons/CubeIcon.svelte";
  import ContractIcon from "../Icons/ContractIcon.svelte";
  import TransactionIcon from "../Icons/TransactionIcon.svelte";
  import utils from "../../utils";
  import store from "../../store";
  import type { Block } from "../../types";

  export let block: Block;

  let blockOps: Array<string> = [];

  const checkForTransactionOps = async (
    blockHash: string
  ): Promise<Array<string>> => {
    // finds block
    try {
      const block_ = await $store.Tezos.rpc.getBlock({ block: block.hash });
      if (block_) {
        // looks for origination ops
        const transactions: Array<string> = [];
        block_.operations.forEach(ops => {
          if (ops.length > 0) {
            ops.forEach(op => {
              if (op.contents.length > 0) {
                op.contents.forEach(_op => {
                  if (_op.kind === OpKind.TRANSACTION) {
                    const hash = op.hash;
                    transactions.push(hash);
                  }
                });
              }
            });
          }
        });
        return transactions;
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  onMount(async () => {
    if ($store.Tezos) {
      try {
        blockOps = await checkForTransactionOps(block.hash);
      } catch (error) {
        console.error(error);
      }
    }
  });
</script>

<style lang="scss">
  @import "../../styles/settings.scss";

  .block {
    margin: 10px 20px;
    width: calc(100% - 80px);
    display: grid;
    grid-template-columns: 5% 10% 20% 30% 20% 15%;
    align-items: center;
    padding: 20px;
    background-color: $dark-yellow;
    border: solid 3px $dark-orange;
    border-radius: 10px;

    a {
      color: inherit;
      text-decoration: none;
    }

    .block-operations {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 20px;
    }
  }
</style>

<div
  class="general-container block"
  transition:fly|local={{ duration: 300, y: -300 }}
>
  <div>
    <CubeIcon color="#24292e" height={28} width={28} />
  </div>
  <div>Level {block.level}</div>
  <div>{block.timestamp}</div>
  <div>{utils.shortenHash(block.hash, 12)}</div>
  <div class="block-operations">
    <div>
      Operations: {block.operationsCount}
    </div>
    <div>
      {#if Object.entries($contractsStore).find(([_, contract]) => contract.origination.level === block.level)}
        <ContractIcon
          color="#24292e"
          height={20}
          width={20}
          amount={Object.entries($contractsStore).filter(
            ([_, contract]) => contract.origination.level === block.level
          ).length}
        />
      {/if}
      {#each blockOps as hash}
        <a href={`#/transactions/${hash}`}>
          <TransactionIcon color="#24292e" height={20} width={20} />
        </a>
      {/each}
    </div>
  </div>
  <div>
    <a href={`#/blocks/${block.hash}`}>
      <button
        class="primary"
        on:click={() => store.updateView("blocks", block.hash)}
      >
        Inspect
      </button>
    </a>
  </div>
</div>
