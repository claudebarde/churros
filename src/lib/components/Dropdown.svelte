<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";

  export let disabled: boolean, selected: string, selection: Array<string>;

  let showList = false;
  const dispatch = createEventDispatcher();

  const capitalize = (str: string): string =>
    str[0].toUpperCase() + str.slice(1);
</script>

<style lang="scss">
  @import "../../styles/settings.scss";

  .dropdown-container {
    position: relative;
    width: 150px;

    .dropdown-list {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      background-color: $yellow;
      border: solid 1px $dark-orange;
      border-top: none;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
      position: absolute;
      width: calc(100% - 2px);
      margin: 0px 10px;

      .dropdown-list__item {
        padding: 10px 20px;
        width: calc(100% - 40px);

        &:hover {
          cursor: pointer;
          background-color: darken($yellow, 10);
        }
      }

      div:last-child {
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
      }
    }
  }
</style>

<div class="dropdown-container">
  <button
    class="dropdown"
    {disabled}
    class:show-list={showList}
    on:click={() => (showList = !showList)}
  >
    {capitalize(selected)}
  </button>
  {#if showList}
    <div class="dropdown-list" transition:slide={{ duration: 300 }}>
      {#each selection as item}
        <div
          class="dropdown-list__item"
          on:click={() => {
            if (!disabled) {
              selected = item;
              showList = false;
              dispatch("select", item);
            }
          }}
        >
          {capitalize(item)}
        </div>
      {/each}
    </div>
  {/if}
</div>
