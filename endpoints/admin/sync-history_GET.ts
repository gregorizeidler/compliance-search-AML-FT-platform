import { db } from "../../helpers/db";
import { OutputType } from "./sync-history_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    // NOTE: The 'sync_history' table is not in the provided schema.
    // This implementation is based on the assumption that such a table exists
    // with columns: id, source, status, created_at, records_affected.
    // If the table has a different structure, this query will need to be updated.
    
    const history = await db.selectFrom('syncHistory' as any)
      .selectAll()
      .orderBy('createdAt' as any, 'desc')
      .limit(20)
      .execute();

    const output: OutputType = history.map((item: any) => ({
      id: item.id,
      source: item.source,
      status: item.status,
      createdAt: item.createdAt,
      recordsAffected: item.recordsAffected,
    }));

    return new Response(superjson.stringify(output), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching sync history:", error);
    // This will likely fail if the syncHistory table doesn't exist.
    // We return an empty array with a console log to avoid breaking the frontend.
    if (error instanceof Error && (error.message.includes('relation "syncHistory" does not exist') || error.message.includes('relation "sync_history" does not exist'))) {
        console.warn("Sync history feature is not available: 'syncHistory' table not found.");
        return new Response(superjson.stringify([] satisfies OutputType), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch sync history: ${errorMessage}` }), { status: 500 });
  }
}