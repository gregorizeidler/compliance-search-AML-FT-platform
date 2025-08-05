import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "../endpoints/admin/stats_GET.schema";
import { getAdminSyncHistory } from "../endpoints/admin/sync-history_GET.schema";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useAdminSyncHistory = () => {
  return useQuery({
    queryKey: ["adminSyncHistory"],
    queryFn: () => getAdminSyncHistory(),
    refetchInterval: 60000, // Refetch every 60 seconds
  });
};