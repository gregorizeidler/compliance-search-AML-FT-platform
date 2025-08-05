import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { SanctionedEntities, SanctionsListSourceArrayValues, EntityTypeArrayValues } from "../helpers/schema";

export const schema = z.object({
  name: z.string().optional(),
  listSources: z.array(z.enum(SanctionsListSourceArrayValues)).optional(),
  entityTypes: z.array(z.enum(EntityTypeArrayValues)).optional(),
  nationalities: z.array(z.string()).optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  results: Selectable<SanctionedEntities>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const postSearch = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/search`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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