import { useMutation } from "@tanstack/react-query";
import { postSearch, InputType, OutputType } from "../endpoints/search_POST.schema";

export const useSearchEntities = () => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postSearch(variables),
  });
};