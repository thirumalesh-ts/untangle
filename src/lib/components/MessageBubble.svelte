<script lang="ts">
  import type { ChatMessage } from "$lib/types";

  export let role: ChatMessage["role"];
  export let message: ChatMessage["message"];

  const isString = (x: unknown): x is string => typeof x === "string";
  
  $: rendered = (message ?? []).map((block) => isString(block) ? block : JSON.stringify(block, null, 2))

  $: align =
    role === "system" ? "center" :
    role === "user" ? "left" : "right";

  $: variant = role;
</script>

<div class="row row--{align}">
  {#each rendered as block}
    <div class="bubble bubble--{variant}">
      <pre>{block}</pre>
    </div>  
  {/each}
</div>

<style>
  .row { display: flex; flex-direction: column; gap: 8px; width: 100%; }
  .row--left { align-items: flex-start; }
  .row--right { align-items: flex-end; }
  .row--center { align-items: center; }

  .bubble {
    max-width: min(720px, 92%);
    padding: 12px 14px;
    border-radius: 14px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
    border: 1px solid rgba(0,0,0,0.2);
  }

  /* requested colors */
  .bubble--system { background: #b61b1b; text-align: left; }
  .bubble--user { background: #c96e10; text-align: left; }
  .bubble--assistant { background: #1a8a38; text-align: left; }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
    line-height: 1.35;
    color: #fff;
  }
</style>
