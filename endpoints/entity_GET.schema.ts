import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { SanctionedEntities } from "../helpers/schema";

export const schema = z.object({
  id: z.coerce.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<SanctionedEntities>;

export const getEntity = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    id: validatedParams.id.toString(),
  });

  const result = await fetch(`/_api/entity?${searchParams.toString()}`, {
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