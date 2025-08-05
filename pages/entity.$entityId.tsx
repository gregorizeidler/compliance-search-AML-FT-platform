import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useEntity } from '../helpers/useEntity';
import { Skeleton } from '../components/Skeleton';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Separator } from '../components/Separator';
import {
  AlertCircle,
  ArrowLeft,
  User,
  Building,
  Calendar as CalendarIcon,
  MapPin,
  Globe,
  FileText,
  Info,
  Hash,
  List,
} from 'lucide-react';
import styles from './entity.$entityId.module.css';

const EntityDetailPage = () => {
  const params = useParams();
  const entityId = Number(params.entityId);

  const { data: entity, isFetching, isError, error } = useEntity(
    { id: entityId },
    { enabled: !isNaN(entityId) }
  );

  if (isFetching) {
    return <EntityDetailSkeleton />;
  }

  if (isError || !entity) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <h2>Entity Not Found</h2>
          <p>
            {error instanceof Error
              ? error.message
              : 'The requested entity could not be found.'}
          </p>
          <Button asChild variant="outline">
            <Link to="/search">
              <ArrowLeft size={16} />
              Back to Search
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-CA');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <>
      <Helmet>
        <title>{entity.name} | Entity Details</title>
        <meta name="description" content={`Detailed information for sanctioned entity: ${entity.name}`} />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.header}>
          <Button asChild variant="ghost" size="sm" className={styles.backButton}>
            <Link to="/search">
              <ArrowLeft size={16} />
              Back to Search
            </Link>
          </Button>
          <div className={styles.titleContainer}>
            {entity.entityType === 'INDIVIDUAL' ? (
              <User className={styles.titleIcon} />
            ) : (
              <Building className={styles.titleIcon} />
            )}
            <h1 className={styles.entityName}>{entity.name}</h1>
          </div>
          <div className={styles.headerBadges}>
            <Badge variant={entity.entityType === 'INDIVIDUAL' ? 'secondary' : 'default'}>
              {entity.entityType}
            </Badge>
            <Badge variant="outline">{entity.listSource}</Badge>
          </div>
        </div>

        <Separator />

        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            <InfoCard title="Sanction Details" icon={<FileText size={18} />}>
              <InfoRow label="Reason for Sanction" value={entity.reason} />
              <InfoRow label="Additional Information" value={entity.additionalInfo} />
            </InfoCard>

            {entity.aliases && entity.aliases.length > 0 && (
              <InfoCard title="Aliases" icon={<List size={18} />}>
                <div className={styles.aliases}>
                  {entity.aliases.map((alias, index) => (
                    <Badge key={index} variant="outline">{alias}</Badge>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          <div className={styles.sidebar}>
            <InfoCard title="Identifiers" icon={<Info size={18} />}>
              <InfoRow label="Date of Birth" value={formatDate(entity.dateOfBirth)} icon={<CalendarIcon size={14} />} />
              <InfoRow label="Place of Birth" value={entity.placeOfBirth} icon={<MapPin size={14} />} />
              <InfoRow label="Nationality" value={entity.nationality} icon={<Globe size={14} />} />
              <InfoRow label="Reference Number" value={entity.referenceNumber} icon={<Hash size={14} />} />
              <InfoRow label="Date Added to List" value={formatDate(entity.dateAdded)} icon={<CalendarIcon size={14} />} />
            </InfoCard>

            {entity.addresses && (
            <InfoCard title="Addresses" icon={<MapPin size={18} />}>
                <pre className={styles.addressBlock}>
                  {JSON.stringify(entity.addresses, null, 2)}
                </pre>
              </InfoCard>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className={styles.infoCard}>
    <h2 className={styles.cardTitle}>
      {icon}
      <span>{title}</span>
    </h2>
    <div className={styles.cardContent}>{children}</div>
  </div>
);

const InfoRow = ({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) => {
  if (!value) return null;
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={styles.infoValue}>{value}</div>
    </div>
  );
};

const EntityDetailSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <Skeleton style={{ width: '120px', height: '2rem' }} />
      <div className={styles.titleContainer}>
        <Skeleton style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
        <Skeleton style={{ width: '300px', height: '2.5rem' }} />
      </div>
      <div className={styles.headerBadges}>
        <Skeleton style={{ width: '80px', height: '1.5rem' }} />
        <Skeleton style={{ width: '60px', height: '1.5rem' }} />
      </div>
    </div>
    <Separator />
    <div className={styles.contentGrid}>
      <div className={styles.mainContent}>
        <div className={styles.infoCard}>
          <Skeleton style={{ width: '200px', height: '1.5rem', marginBottom: 'var(--spacing-4)' }} />
          <Skeleton style={{ width: '90%', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '70%', height: '1rem' }} />
        </div>
      </div>
      <div className={styles.sidebar}>
        <div className={styles.infoCard}>
          <Skeleton style={{ width: '150px', height: '1.5rem', marginBottom: 'var(--spacing-4)' }} />
          <Skeleton style={{ width: '100%', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '80%', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '90%', height: '1rem' }} />
        </div>
      </div>
    </div>
  </div>
);

export default EntityDetailPage;