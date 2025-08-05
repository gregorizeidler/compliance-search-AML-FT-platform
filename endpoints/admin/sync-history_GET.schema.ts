import { z } from "zod";
import superjson from 'superjson';
import { SanctionsListSourceArrayValues } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

const SyncStatusSchema = z.union([z.literal("SUCCESS"), z.literal("FAILURE")]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

const SanctionsListSourceSyncable = z.enum(SanctionsListSourceArrayValues);

export const SyncHistoryEntrySchema = z.object({
    id: z.number(),
    source: SanctionsListSourceSyncable,
    status: SyncStatusSchema,
    createdAt: z.date(),
    recordsAffected: z.number().nullable(),
});

export type SyncHistoryEntry = z.infer<typeof SyncHistoryEntrySchema>;

export type OutputType = SyncHistoryEntry[];

export const getAdminSyncHistory = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/sync-history`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage = typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject && typeof errorObject.error === 'string' 
      ? errorObject.error 
      : 'An unknown error occurred';
    throw new Error(errorMessage);
  }
  const data = superjson.parse<OutputType>(await result.text());
  // Validate each entry in the array
  z.array(SyncHistoryEntrySchema).parse(data);
  return data;
};