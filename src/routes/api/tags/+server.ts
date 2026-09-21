import { store } from "$lib/store.js";
import { json } from "@sveltejs/kit";

export async function GET({ url }) {
    const sessionID = url.searchParams.get("sessionID");
    if (!sessionID) {
        return json({
            ok: false,
            error: "sessionID is required"
        }, { status: 400 });
    }

    const session = store.find((s) => s.id === sessionID);
    if (!session) {
        return json({
            ok: false,
            error: "session not found"
        }, { status: 404 });
    }

    const tags = Object.values(session.threads).map((t) => t.tag);
    return json({
        ok: true,
        tags
    });
}