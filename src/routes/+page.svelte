<script lang="ts">
  import TagStrip from "$lib/components/TagStrip.svelte";
  import MessageList from "$lib/components/MessageList.svelte";
  import ErrorBanner from "$lib/components/ErrorBanner.svelte";
  import SidePanel from "$lib/components/SidePanel.svelte";
  import type { ChatThread } from "$lib/types";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import { onMount } from "svelte";

  
  type Thread = Omit<ChatThread, "promptID">;
  
  type SessionSummary = { id: string; name?: string; description?: string; promptIDs: string[], tags: Record<string, string> };

  let { data }: { data: PageData } = $props();

  let current = $state<{ sessionID?: string; promptID?: string }>({});

  let messageCache: Record<string, Record<string, Thread | null>> = $state({});

  let sessions: SessionSummary[] = $state([]);

  let currentSession = $derived(
    current.sessionID ? sessions.find((s) => s.id === current.sessionID) : null
  );

  let currentThread: Thread | null = $state(null);

  let activePanel: "formatKeys" | "schema" | null = $state(null);

  // Close any open panel when switching tag/session so stale data isn't shown.
  $effect(() => {
    current.sessionID;
    current.promptID;
    activePanel = null;
  });

  let loadError: string | null = $state(null);

  // Add the session to the sidebar, or refresh its tags if already listed.
  function upsertSession(summary: SessionSummary) {
    const existing = sessions.find((s) => s.id === summary.id);
    if (existing) {
      existing.tags = summary.tags;
    } else {
      sessions.unshift(summary);
    }
  }

  onMount(() => {
    if (!data.initial.ok) return;

    for (const session of data.initial.sessions) {
      upsertSession({ id: session.id, name: session.name, description: session.description, promptIDs: session.threads.map((t) => t.promptID), tags: Object.fromEntries(session.threads.map((t) => [t.promptID, t.tag ?? t.promptID])) });

      messageCache[session.id] = {};
      for (const thread of session.threads) {
        messageCache[session.id][thread.promptID] = thread;
      }
    }

    const latest = data.initial.sessions.at(-1);
    if (latest) {
      current = { sessionID: latest.id, promptID: latest.threads.at(-1)?.promptID };
    }
  });

  // Keep the URL in sync with the selection and load the selected tag's messages.
  $effect(() => {
    loadError = null;

    const { sessionID, promptID } = current;
    if (!sessionID) {
      goto("/", { replaceState: true, noScroll: true });
      return;
    }

    // Fall back to the session's last tag if the current one isn't valid.
    if (!currentSession?.promptIDs.includes(promptID ?? "")) {
      current.promptID = currentSession?.promptIDs.at(-1);
    }
    if (!current.promptID) return;

    goto(`/?sessionID=${encodeURIComponent(sessionID)}&promptID=${encodeURIComponent(current.promptID)}`, {
      replaceState: true,
      noScroll: true
    });

    const cached = messageCache[sessionID]?.[current.promptID];
    if (cached !== undefined) {
      currentThread = cached;
      loadMessages(sessionID, current.promptID); // refresh in the background
    } else {
      loadMessages(sessionID, current.promptID).then(() => {
        currentThread = messageCache[sessionID]?.[current.promptID!] ?? null;
      });
    }
  });

  async function getAllSessions() {
    const res = await fetch("/api/sessions");
    const json: { ok: boolean; sessions: SessionSummary[] } = await res.json();
    if (!json.ok) return;

    for (const session of json.sessions) {
      upsertSession(session);
    }

    if (!current.sessionID) {
      current.sessionID = json.sessions.at(-1)?.id;
    }
  }

  async function loadMessages(sessionID: string, promptID: string) {
    const res = await fetch(
      `/api/sessions/${encodeURIComponent(sessionID)}/threads?promptID=${encodeURIComponent(promptID)}`
    );
    const json = await res.json();
    if (!json.ok) {
      loadError = json.error ?? "Error loading messages";
      return;
    }

    const thread = (json.threads as Record<string, ChatThread>)[promptID];
    if (!thread) return;

    messageCache[json.id] ??= {};
    messageCache[json.id][promptID] = thread;
    current.promptID ??= promptID;
  }

  // Client-only polling so the UI updates when API is hit externally.
  const POLL_MS = 1500;

  $effect(() => {
    const timer = setInterval(getAllSessions, POLL_MS);
    return () => clearInterval(timer);
  });
</script>

<svelte:head>
  <title>Message Viewer</title>
</svelte:head>


<div class="layout">
  <aside class="sidebar">
    <div class="header">
      Untangle
    </div>
    
    <nav>
      {#each sessions as s}
        <button class="session {current.sessionID === s.id ? "selected" : ""}" onclick={() => { current.sessionID = s.id }}>
          <div>{s.name}</div>
        </button>
      {/each}
    </nav>
  </aside>

  <div class="app">
    <div class="topbar">
      {#if currentSession?.tags}
        <TagStrip tags={currentSession.tags} selectedID={current.promptID} onSelect={(id) => { current!.promptID = id }} />
      {/if}
    </div>

    <div class="body">
      <div class="content">
        <ErrorBanner error={loadError} />

        {#if !current.promptID}
          <div class="hint">Select a tag to view messages.</div>
        {:else if !currentThread || currentThread.messages.length === 0}
          <div class="hint">No messages for “{currentSession?.tags[current.promptID]}”.</div>
        {:else}
          <MessageList
            messages={currentThread.messages}
            messagesAt={currentThread.messagesAt}
            response={currentThread.response}
            responseAt={currentThread.responseAt}
          />
        {/if}
      </div>

      {#if activePanel === 'formatKeys'}
        <SidePanel
          title="Format Keys"
          data={currentThread?.args ?? {}}
          onClose={() => activePanel = null}
        />
      {:else if activePanel === 'schema'}
        <SidePanel
          title="Schema"
          data={currentThread?.schema}
          onClose={() => activePanel = null}
        />
      {/if}

      <div class="toolstrip">
        <button
          class="tool {activePanel === 'formatKeys' ? 'active' : ''}"
          disabled={!current.promptID}
          onclick={() => activePanel = activePanel === 'formatKeys' ? null : 'formatKeys'}
        >
          Format Keys
        </button>
        <button
          class="tool {activePanel === 'schema' ? 'active' : ''}"
          disabled={!current.promptID || !currentThread?.schema}
          onclick={() => activePanel = activePanel === 'schema' ? null : 'schema'}
        >
          Schema
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .layout {
    display: flex;
  }

  .app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    background: #0b0b0c;
    color: #f3f3f3;
    flex-grow: 1;
    min-width: 0;
  }

  .topbar {
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    background: #111114;
  }

  .body {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: row;
    min-height: 0;
  }

  .toolstrip {
    flex-shrink: 0;
    width: 44px;
    display: flex;
    flex-direction: column;
    background: #0d0d10;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    z-index: 30;
  }

  .tool {
    writing-mode: vertical-rl;
    width: 100%;
    border: none;
    background: transparent;
    color: #cfcfcf;
    padding: 14px 0;
    cursor: pointer;
    font-size: 0.8rem;
    letter-spacing: 0.02em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    transition: 0.1s;
  }

  .tool:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  .tool.active {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  .tool:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .content {
    flex: 1;
    padding: 16px;
    overflow: auto;
    min-width: 0;
  }

  .hint {
    opacity: 0.8;
    padding: 16px;
    border: 1px dashed rgba(255, 255, 255, 0.18);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    max-width: 720px;
  }

  .header {
    font-size: large;
    margin-inline-start: 20px;
    margin-top: 28px;
    margin-bottom: 16px;
    font-family: 'system-ui';
    color: #f0f0f0;
  }

  .session {
    border: none;
    background: rgba(255,255,255,0.06);
    color: #fff;
    padding: 12px 12px;
    margin-inline-start: 16px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1 0 auto;
    width: 226px;
    text-align: start;
    text-overflow: ellipsis;
    overflow: hidden;
    transition: 0.1s;
    margin: 2px 12px;
  }

  .session:hover {
    background: rgba(255,255,255,0.1);
  }

  .session.selected {
    background: rgba(255,255,255,0.16);
  }

  .sidebar {
    width: 250px;
    height: 100vh;
    background: #030304;
    transition: transform 0.3s ease-in-out;
    overflow-x: hidden;
    overflow-y: auto;
    flex-shrink: 0;
  }
</style>
