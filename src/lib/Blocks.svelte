<script lang="ts">
  import type { BlockResponse, BlockFullHeader } from "@taquito/rpc";
  import { onMount, afterUpdate } from "svelte";
  import { fly } from "svelte/transition";
  import store from "../store";
  import contractsStore from "../contractsStore";
  import utils from "../utils";
  import CubeIcon from "./Icons/CubeIcon.svelte";

  let selectedBlock: BlockResponse;
  let originatedContracts = [];
  let keySearch = "";
  let keySearchResult: undefined | boolean = undefined;
  let lastKeySearch = { id: "", text: "" };

  const parseBlockInfo = (
    info: BlockFullHeader
  ): Array<{ title: string; info: any }> => {
    const infoTitles = Object.keys(info);
    return infoTitles.map(title => ({ title, info: info[title] }));
  };

  const searchKey = () => {
    // unwrap the previous search
    if (lastKeySearch.id) {
      const el = document.getElementById(lastKeySearch.id);
      el.innerHTML = lastKeySearch.text;
    }

    const sections = ["header", "metadata"];
    const foundIds = sections
      .map(section => {
        const id = `${keySearch.trim()}-${section}-searchkey`;
        const el = document.getElementById(id);
        if (el) {
          return id;
        } else {
          return undefined;
        }
      })
      .filter(el => el);
    if (foundIds.length > 0) {
      keySearchResult = true;
      // wraps the result in <mark> tags
      const foundEl = foundIds[0];
      const el = document.getElementById(foundEl);
      const elInner = el.innerHTML;
      lastKeySearch = { id: foundEl, text: elInner };
      el.innerHTML = `<mark>${elInner}</mark>`;
      // scroll to element
      document.querySelector("#" + foundEl).scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } else {
      keySearchResult = false;
    }
  };

  onMount(async () => {
    if ($store.blocks && $store.blocks.length > 0 && $store.viewParams) {
      const block = $store.blocks.find(
        block => block.hash === $store.viewParams
      );
      if (block) {
        selectedBlock = await $store.Tezos.rpc.getBlock({ block: block.hash });
      } else {
        store.updateToast({
          showToast: true,
          toastType: "error",
          toastText: `Cannot find block ${utils.shortenHash($store.viewParams)}`
        });
      }
    }
  });

  afterUpdate(() => {
    // checks for originated contract
    if (selectedBlock) {
      const originationRes = utils.checkForOriginationOps(selectedBlock);
      if (originationRes && originationRes.length > 0) {
        originatedContracts = [...originationRes];
      }
    }
  });
</script>

<style lang="scss">
  .block-details-container {
    $v-padding: 30px;
    padding: $v-padding 40px;
    height: calc(100% - #{$v-padding} * 2);
    overflow: auto;

    .search-keys {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 20px;
    }
  }
</style>

<div class="data-display-container">
  <div class="data-display-menu">
    {#if selectedBlock}
      <button class="primary selected-data-display" disabled>
        <CubeIcon color="white" width={24} height={24} />
        {utils.shortenHash(selectedBlock.hash)} (level {selectedBlock.header
          .level})
      </button>
      <div class="separator" />
    {/if}
    <div
      class="data-display-list"
      style={selectedBlock ? "height:90%" : "height:100%"}
    >
      {#each $store.blocks as block (block.hash)}
        <button
          class="primary"
          transition:fly|local={{ duration: 300, y: -300 }}
          on:click={async () => {
            document.getElementById("block-details-container").scrollIntoView();
            selectedBlock = await $store.Tezos.rpc.getBlock({
              block: block.hash
            });
          }}
        >
          <CubeIcon
            color={selectedBlock && block.hash === selectedBlock.hash
              ? "white"
              : "#834112"}
            width={24}
            height={24}
          />
          {utils.shortenHash(block.hash)} (level {block.level})
        </button>
      {:else}
        <div>No blocks to display</div>
      {/each}
    </div>
  </div>
  <div class="block-details-container">
    <div
      id="block-details-container"
      class="general-container data-display-details"
    >
      {#if selectedBlock}
        <h3>Block {selectedBlock.hash}</h3>
        <div class="search-keys">
          <div class="input-with-button">
            <input
              type="text"
              placeholder="Search key"
              bind:value={keySearch}
              on:input={() => (keySearchResult = undefined)}
            />
            <button on:click={searchKey}> Search </button>
          </div>
          <div>
            {#if keySearchResult !== undefined && keySearchResult === false}
              No result
            {/if}
          </div>
        </div>
        <div>
          <h4>Chain ID</h4>
          <div class="data-display-details__info">{selectedBlock.chain_id}</div>
          <h4>Header</h4>
          <div class="data-display-details__info">
            {#each parseBlockInfo(selectedBlock.header) as item}
              <div id={`${item.title}-header-searchkey`}>{item.title}</div>
              <div>{item.info}</div>
            {/each}
          </div>
          {#if originatedContracts.length > 0}
            <h4>Originated contracts</h4>
            <div class="data-display-details__info">
              {#each originatedContracts as contract}
                <div />
                <div>
                  <button
                    class="link"
                    on:click={() =>
                      store.updateView("contracts", contract.address)}
                  >
                    {contract.address}
                  </button>
                </div>
              {/each}
            </div>
          {/if}
          <h4>Metadata</h4>
          <div class="data-display-details__info">
            <!--
              <pre>
                {JSON.stringify(selectedBlock.metadata, null, 2)}
              </pre>
              -->
            {#each Object.entries(selectedBlock.metadata) as [metadataKey, metadataValue]}
              <div id={`${metadataKey}-metadata-searchkey`}>{metadataKey}</div>
              {@html utils.json2html(metadataValue)}
            {/each}
          </div>
          <h4>Operations</h4>
          <div class="data-display-details__info">
            <pre>
                {JSON.stringify(selectedBlock.operations, null, 2)}
            </pre>
          </div>
        </div>
      {:else}
        <div>Select a block to display its data</div>
      {/if}
    </div>
  </div>
</div>
