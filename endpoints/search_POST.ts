import { db } from "../helpers/db";
import { schema, InputType, OutputType } from "./search_POST.schema";
import superjson from 'superjson';
import { Kysely, sql } from "kysely";
import { DB } from "../helpers/schema";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text()) || {};
    const { 
      name, 
      listSources, 
      entityTypes, 
      nationalities, 
      page = 1, 
      pageSize = 20 
    } = schema.parse(json);

    const offset = (page - 1) * pageSize;

    // Helper function to apply common filters to a query
    const applyFilters = (query: any) => {
      if (name) {
        // Using ilike for case-insensitive partial matching
        query = query.where('name', 'ilike', `%${name}%`);
      }
      if (listSources && listSources.length > 0) {
        query = query.where('listSource', 'in', listSources);
      }
      if (entityTypes && entityTypes.length > 0) {
        query = query.where('entityType', 'in', entityTypes);
      }
      if (nationalities && nationalities.length > 0) {
        query = query.where('nationality', 'in', nationalities);
      }
      return query;
    };

    // Create separate query for count
    let countQuery = db.selectFrom('sanctionedEntities');
    countQuery = applyFilters(countQuery);

    // Execute count query
    const totalResult = await countQuery
      .select(db.fn.count<string>('id').as('count'))
      .executeTakeFirstOrThrow();
    
    const total = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(total / pageSize);

    // Create separate query for data retrieval
    let dataQuery = db.selectFrom('sanctionedEntities');
    dataQuery = applyFilters(dataQuery);

    // Execute data query with pagination and ordering
    const results = await dataQuery
      .selectAll()
      .orderBy('name', 'asc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    const response: OutputType = {
      results,
      total,
      page,
      pageSize,
      totalPages,
    };

    return new Response(superjson.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in search_POST:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}