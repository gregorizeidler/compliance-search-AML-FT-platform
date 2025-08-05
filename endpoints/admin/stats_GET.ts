import { db } from "../../helpers/db";
import { OutputType } from "./stats_GET.schema";
import superjson from 'superjson';
import { SanctionsListSourceArrayValues, EntityTypeArrayValues } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    // First query: Get counts and last updated timestamp by source
    const sourceStatsResult = await db
      .selectFrom('sanctionedEntities')
      .select([
        'listSource',
        db.fn.count('id').as('count'),
        db.fn.max('updatedAt').as('lastUpdatedAt')
      ])
      .groupBy('listSource')
      .execute();

    // Second query: Get counts by entity type
    const typeCountsResult = await db
      .selectFrom('sanctionedEntities')
      .select([
        'entityType',
        db.fn.count('id').as('count')
      ])
      .groupBy('entityType')
      .execute();

    const countsBySource = SanctionsListSourceArrayValues.reduce((acc, source) => {
      const found = sourceStatsResult.find(r => r.listSource === source);
      acc[source] = Number(found?.count ?? 0);
      return acc;
    }, {} as Record<typeof SanctionsListSourceArrayValues[number], number>);

    const countsByType = EntityTypeArrayValues.reduce((acc, type) => {
      const found = typeCountsResult.find(r => r.entityType === type);
      acc[type] = Number(found?.count ?? 0);
      return acc;
    }, {} as Record<typeof EntityTypeArrayValues[number], number>);

    const lastUpdatedAtBySource = SanctionsListSourceArrayValues.reduce((acc, source) => {
      const found = sourceStatsResult.find(r => r.listSource === source);
      acc[source] = found?.lastUpdatedAt ?? null;
      return acc;
    }, {} as Record<typeof SanctionsListSourceArrayValues[number], Date | null>);

    // Calculate total records from source counts instead of separate query
    const totalRecords = Object.values(countsBySource).reduce((sum, count) => sum + count, 0);

    const output: OutputType = {
      countsBySource,
      countsByType,
      lastUpdatedAtBySource,
      totalRecords,
    };

    return new Response(superjson.stringify(output), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch admin statistics: ${errorMessage}` }), { status: 500 });
  }
}