import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postSyncAll } from "../endpoints/sync/all_POST.schema";
import { postSyncOfac } from "../endpoints/sync/ofac_POST.schema";
import { postSyncEu } from "../endpoints/sync/eu_POST.schema";
import { postSyncUn } from "../endpoints/sync/un_POST.schema";
import { postSyncInterpol } from "../endpoints/sync/interpol_POST.schema";

type SyncSource = "all" | "ofac" | "eu" | "un" | "interpol";

const syncFunctions = {
  all: postSyncAll,
  ofac: postSyncOfac,
  eu: postSyncEu,
  un: postSyncUn,
  interpol: postSyncInterpol,
};

export const useSync = (source: SyncSource) => {
  return useMutation({
    mutationFn: () => syncFunctions[source](),
    onMutate: () => {
      toast.loading(`Starting ${source.toUpperCase()} sync...`);
    },
    onSuccess: (data) => {
      toast.dismiss();
      if (data.success) {
        toast.success(`${source.toUpperCase()} sync completed successfully.`);
      } else {
        toast.warning(`${source.toUpperCase()} sync: ${data.message}`);
      }
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(`Failed to sync ${source.toUpperCase()}: ${error.message}`);
    },
  });
};