import { db } from "../helpers/db";
import { schema, OutputType } from "./entity_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const { id } = schema.parse({
      id: url.searchParams.get('id')
    });

    const entity = await db.selectFrom('sanctionedEntities')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    if (!entity) {
      return new Response(superjson.stringify({ error: "Entity not found" }), { status: 404 });
    }

    return new Response(superjson.stringify(entity satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in entity_GET:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}