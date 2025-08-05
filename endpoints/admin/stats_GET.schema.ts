import { z } from "zod";
import superjson from 'superjson';
import { SanctionsListSourceArrayValues, EntityTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  countsBySource: Record<typeof SanctionsListSourceArrayValues[number], number>;
  countsByType: Record<typeof EntityTypeArrayValues[number], number>;
  lastUpdatedAtBySource: Record<typeof SanctionsListSourceArrayValues[number], Date | null>;
  totalRecords: number;
};

export const getAdminStats = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/stats`, {
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
  return superjson.parse<OutputType>(await result.text());
};