import type { PageLoad } from "./$types";
import type { Session, ChatThread } from "$lib/types";

type LoadedSession = Omit<Session, "tags"> & { threads: ChatThread[] };

type LoadResult =
  | { ok: true; sessions: LoadedSession[] }
  | { ok: false; error: string };

export const load: PageLoad = async ({ fetch, url }) => {
  const params = new URLSearchParams();
  const sessionID = url.searchParams.get("sessionID");
  const tag = url.searchParams.get("tag");
  if (sessionID) params.set("sessionID", sessionID);
  if (sessionID && tag) params.set("tag", tag);

  const query = params.toString();
  const res = await fetch(`/api/threads${query ? `?${query}` : ""}`);
  const data = await res.json();

  const initial: LoadResult = data?.ok
    ? { ok: true, sessions: data.sessions }
    : { ok: false, error: data?.error ?? "Failed to load messages" };

  return { initial };
};
