import { store } from "$lib/store";
import { json } from "@sveltejs/kit";

/**
 * POST /api/sessions
 * body: { id, name?, description? }
 * Creates a session or updates its name/description.
 */
export async function POST({ request }) {
  const { id, name, description } = await request.json();

  const session = store.find((s) => s.id === id);
  if (session) {
    session.name = name;
    session.description = description;
  } else {
    store.push({ id, name, description, threads: {} });
  }

  return json(
    { ok: true, message: "Session named successfully" },
    { status: session ? 200 : 201 }
  );
}

/**
 * GET /api/sessions
 * Returns every session with its tag names.
 */
export async function GET() {
  return json({
    ok: true,
    sessions: store.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      promptIDs: Object.values(s.threads).map((t) => t.promptID),
      tags: Object.fromEntries(
        Object.values(s.threads).map((t) => [t.promptID, t.tag ?? t.promptID])
      )
    }))
  });
}
