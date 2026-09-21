<script lang="ts">
const { tags, selectedID, onSelect }: { tags: Record<string, string>, selectedID?: string, onSelect: (id: string) => void } = $props();

let ids = $derived(Object.keys(tags));

</script>

<div class="tagstrip" aria-label="Tags">
  {#if ids.length === 0}
    <div class="tag tag--empty">No tags yet</div>
  {:else}
    {#each ids as id}
      <button
        class="tag {selectedID === id ? 'tag--active' : ''}"
        onclick={() => onSelect(id)}
        title={tags[id]}
      >
        {tags[id]}
      </button>
    {/each}
  {/if}
</div>

<style>
  .tagstrip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding-top: 2px;
    padding-bottom: 2px;
  }

  .tagstrip::-webkit-scrollbar {
    height: 8px;
  }
  .tagstrip::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.18);
    border-radius: 999px;
  }

  .tag {
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.06);
    color: #fff;
    padding: 8px 12px;
    border-radius: 999px;
    cursor: pointer;
    flex: 0 0 auto;
    max-width: 260px;
    text-overflow: ellipsis;
    overflow: hidden;
    transition: 0.1s;
  }

  .tag--active {
    border-color: rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.14);
  }

  .tag--empty {
    cursor: default;
    opacity: 0.8;
  }
</style>