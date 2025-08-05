import { useQuery } from "@tanstack/react-query";
import { getEntity, InputType, OutputType } from "../endpoints/entity_GET.schema";

export const useEntity = (params: InputType, options?: { enabled?: boolean }) => {
  return useQuery<OutputType, Error>({
    queryKey: ['entity', params.id],
    queryFn: () => getEntity(params),
    enabled: options?.enabled,
  });
};