import React from "react";
import { Helmet } from "react-helmet";
import { RefreshCw, BarChart3, History, AlertTriangle } from "lucide-react";
import { Button } from "../components/Button";
import { useSync } from "../helpers/useSync";
import { useAdminStats, useAdminSyncHistory } from "../helpers/useAdminData";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import styles from "./admin.module.css";

type SyncSource = "all" | "ofac" | "eu" | "un" | "interpol";

const SYNC_SOURCES: { id: SyncSource; name: string }[] = [
  { id: "ofac", name: "OFAC" },
  { id: "un", name: "UN" },
  { id: "eu", name: "EU" },
  { id: "interpol", name: "Interpol" },
];

const AdminPage = () => {
  const allSync = useSync("all");
  const ofacSync = useSync("ofac");
  const unSync = useSync("un");
  const euSync = useSync("eu");
  const interpolSync = useSync("interpol");

  const syncs = {
    all: allSync,
    ofac: ofacSync,
    un: unSync,
    eu: euSync,
    interpol: interpolSync,
  };

  const isAnySyncRunning = Object.values(syncs).some((s) => s.isPending);
  
  const { data: stats, isFetching: statsLoading, error: statsError } = useAdminStats();
  const { data: syncHistory, isFetching: historyLoading, error: historyError } = useAdminSyncHistory();

  const handleSync = (source: SyncSource) => {
    syncs[source].mutate();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "SUCCESS" ? "success" : "destructive";
  };

  return (
    <>
      <Helmet>
        <title>Admin - Data Synchronization</title>
        <meta
          name="description"
          content="Manage data synchronization for restrictive lists."
        />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Data Synchronization</h1>
          <p className={styles.subtitle}>
            Manage and monitor data synchronization from all sources.
          </p>
        </header>

        <div className={styles.contentGrid}>
          <div className={`${styles.card} ${styles.syncCard}`}>
            <div className={styles.cardHeader}>
              <RefreshCw className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Sync Controls</h2>
              <Button
                onClick={() => handleSync("all")}
                disabled={isAnySyncRunning}
                className={styles.syncAllButton}
              >
                {syncs.all.isPending ? "Syncing..." : "Sync All"}
                <RefreshCw size={16} className={syncs.all.isPending ? styles.spinning : ""} />
              </Button>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardDescription}>
                Trigger synchronization for individual data sources. A full sync
                can take several minutes.
              </p>
              <ul className={styles.sourceList}>
                {SYNC_SOURCES.map(({ id, name }) => {
                  const sync = syncs[id];
                  return (
                    <li key={id} className={styles.sourceItem}>
                      <span className={styles.sourceName}>{name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(id)}
                        disabled={isAnySyncRunning}
                      >
                        {sync.isPending ? "Syncing..." : "Sync Now"}
                        {sync.isPending && <RefreshCw size={14} className={styles.spinning} />}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className={`${styles.card} ${styles.statsCard}`}>
            <div className={styles.cardHeader}>
              <BarChart3 className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Database Statistics</h2>
            </div>
            <div className={styles.cardContent}>
              {statsLoading ? (
                <div className={styles.statsLoading}>
                  <Skeleton style={{ height: "2rem", marginBottom: "var(--spacing-4)" }} />
                  <div className={styles.statsGrid}>
                    <Skeleton style={{ height: "4rem" }} />
                    <Skeleton style={{ height: "4rem" }} />
                    <Skeleton style={{ height: "4rem" }} />
                    <Skeleton style={{ height: "4rem" }} />
                  </div>
                </div>
              ) : statsError ? (
                <div className={styles.placeholder}>
                  <AlertTriangle size={24} className={styles.placeholderIcon} />
                  <p className={styles.placeholderText}>
                    Failed to load statistics
                  </p>
                  <span className={styles.placeholderSubtext}>
                    {statsError.message}
                  </span>
                </div>
              ) : stats ? (
                <div className={styles.statsContent}>
                  <div className={styles.totalRecords}>
                    <span className={styles.totalNumber}>{stats.totalRecords.toLocaleString()}</span>
                    <span className={styles.totalLabel}>Total Records</span>
                  </div>
                  
                  <div className={styles.statsSection}>
                    <h3 className={styles.sectionTitle}>By Source</h3>
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.countsBySource.OFAC.toLocaleString()}</span>
                        <span className={styles.statLabel}>OFAC</span>
                        <span className={styles.statLastUpdate}>
                          {formatDate(stats.lastUpdatedAtBySource.OFAC)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.countsBySource.UN.toLocaleString()}</span>
                        <span className={styles.statLabel}>UN</span>
                        <span className={styles.statLastUpdate}>
                          {formatDate(stats.lastUpdatedAtBySource.UN)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.countsBySource.EU.toLocaleString()}</span>
                        <span className={styles.statLabel}>EU</span>
                        <span className={styles.statLastUpdate}>
                          {formatDate(stats.lastUpdatedAtBySource.EU)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.countsBySource.INTERPOL.toLocaleString()}</span>
                        <span className={styles.statLabel}>Interpol</span>
                        <span className={styles.statLastUpdate}>
                          {formatDate(stats.lastUpdatedAtBySource.INTERPOL)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.statsSection}>
                    <h3 className={styles.sectionTitle}>By Type</h3>
                    <div className={styles.typeStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.countsByType.INDIVIDUAL.toLocaleString()}</span>
                        <span className={styles.statLabel}>Individuals</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.countsByType.ENTITY.toLocaleString()}</span>
                        <span className={styles.statLabel}>Entities</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`${styles.card} ${styles.historyCard}`}>
            <div className={styles.cardHeader}>
              <History className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Recent Synchronizations</h2>
            </div>
            <div className={styles.cardContent}>
              {historyLoading ? (
                <div className={styles.historyLoading}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.historyItemSkeleton}>
                      <Skeleton style={{ width: "4rem", height: "1.5rem" }} />
                      <Skeleton style={{ width: "6rem", height: "1.25rem" }} />
                      <Skeleton style={{ width: "8rem", height: "1rem" }} />
                      <Skeleton style={{ width: "5rem", height: "1rem" }} />
                    </div>
                  ))}
                </div>
              ) : historyError ? (
                <div className={styles.placeholder}>
                  <AlertTriangle size={24} className={styles.placeholderIcon} />
                  <p className={styles.placeholderText}>
                    Failed to load sync history
                  </p>
                  <span className={styles.placeholderSubtext}>
                    {historyError.message}
                  </span>
                </div>
              ) : syncHistory && syncHistory.length > 0 ? (
                <div className={styles.historyList}>
                  {syncHistory.map((entry) => (
                    <div key={entry.id} className={styles.historyItem}>
                      <div className={styles.historyItemHeader}>
                        <span className={styles.historySource}>{entry.source}</span>
                        <Badge variant={getStatusBadgeVariant(entry.status)}>
                          {entry.status}
                        </Badge>
                      </div>
                      <div className={styles.historyItemDetails}>
                        <span className={styles.historyDate}>
                          {formatDate(entry.createdAt)}
                        </span>
                        {entry.recordsAffected !== null && (
                          <span className={styles.historyRecords}>
                            {entry.recordsAffected.toLocaleString()} records
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholder}>
                  <History size={24} className={styles.placeholderIcon} />
                  <p className={styles.placeholderText}>
                    No synchronization history
                  </p>
                  <span className={styles.placeholderSubtext}>
                    Run your first sync to see history here.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;