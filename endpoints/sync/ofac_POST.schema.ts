import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postSyncOfac = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/sync/ofac`, {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage = typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject 
      ? String(errorObject.error) 
      : 'An unknown error occurred';
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};