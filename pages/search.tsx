import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { useForm } from '../components/Form';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../components/Form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/Select';
import { Skeleton } from '../components/Skeleton';
import { Badge } from '../components/Badge';
import { useSearchEntities } from '../helpers/useSearchEntities';
import {
  SanctionsListSourceArrayValues,
  EntityTypeArrayValues,
} from '../helpers/schema';
import { Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import styles from './search.module.css';

const searchPageSchema = z.object({
  name: z.string().optional(),
  listSources: z.string().optional(),
  entityTypes: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
});

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchMutation = useSearchEntities();

  const form = useForm({
    schema: searchPageSchema,
    defaultValues: {
      name: '',
      listSources: '',
      entityTypes: '',
    },
  });

  const { page = 1 } = searchPageSchema.parse(
    Object.fromEntries(searchParams),
  );

  const performSearch = (values: z.infer<typeof searchPageSchema>, pageNum: number) => {
    const listSources = values.listSources && values.listSources !== '__empty' && values.listSources.trim() !== ''
      ? values.listSources.split(',').filter(Boolean) as (typeof SanctionsListSourceArrayValues)[number][] | undefined
      : undefined;
    const entityTypes = values.entityTypes && values.entityTypes !== '__empty' && values.entityTypes.trim() !== ''
      ? values.entityTypes.split(',').filter(Boolean) as (typeof EntityTypeArrayValues)[number][] | undefined
      : undefined;

    searchMutation.mutate({
      name: values.name && values.name.trim() !== '' ? values.name.trim() : undefined,
      listSources: listSources?.length ? listSources : undefined,
      entityTypes: entityTypes?.length ? entityTypes : undefined,
      page: pageNum,
      pageSize: 10,
    });

    const newParams = new URLSearchParams();
    if (values.name && values.name.trim() !== '') newParams.set('name', values.name.trim());
    if (values.listSources && values.listSources !== '__empty' && values.listSources.trim() !== '') {
      newParams.set('listSources', values.listSources);
    }
    if (values.entityTypes && values.entityTypes !== '__empty' && values.entityTypes.trim() !== '') {
      newParams.set('entityTypes', values.entityTypes);
    }
    if (pageNum > 1) newParams.set('page', String(pageNum));
    setSearchParams(newParams);
  };

  useEffect(() => {
    const urlParams = Object.fromEntries(searchParams);
    const parsedValues = searchPageSchema.parse(urlParams);
    
    // Update form values to match URL params
    form.setValues({
      name: searchParams.get('name') || '',
      listSources: searchParams.get('listSources') || '',
      entityTypes: searchParams.get('entityTypes') || '',
      page: parsedValues.page,
    });
    
    performSearch(parsedValues, parsedValues.page);
  }, [searchParams]); // Re-run when URL params change

  const handleSubmit = (values: z.infer<typeof searchPageSchema>) => {
    performSearch(values, 1);
  };

  const handlePageChange = (newPage: number) => {
    performSearch(form.values, newPage);
  };

  const { data, isPending, isError, error } = searchMutation;

  return (
    <>
      <Helmet>
        <title>Search Restrictive Lists | Floot</title>
        <meta
          name="description"
          content="Search and filter OFAC, UN, EU, and Interpol restrictive lists."
        />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerGlow}></div>
          <h1 className={styles.headerTitle}>
            <span className={styles.techAccent}>Restrictive Lists</span> Search
          </h1>
          <p className={styles.headerSubtitle}>
            Screen individuals and entities against global sanctions lists with advanced AI-powered search
          </p>
        </div>

        <div className={styles.searchFormContainer}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className={styles.form}
            >
              <div className={styles.formGrid}>
                <FormItem name="name" className={styles.nameField}>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Search by name..."
                      value={form.values.name}
                      onChange={(e) =>
                        form.setValues((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </FormControl>
                </FormItem>
                <FormItem name="listSources">
                  <FormLabel>List Sources</FormLabel>
                  <FormControl>
                    <Select
                      value={form.values.listSources}
                      onValueChange={(value) =>
                        form.setValues((prev) => ({
                          ...prev,
                          listSources: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty">All Sources</SelectItem>
                        {SanctionsListSourceArrayValues.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <FormItem name="entityTypes">
                  <FormLabel>Entity Type</FormLabel>
                  <FormControl>
                    <Select
                      value={form.values.entityTypes}
                      onValueChange={(value) =>
                        form.setValues((prev) => ({
                          ...prev,
                          entityTypes: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty">All Types</SelectItem>
                        {EntityTypeArrayValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              </div>
              <Button type="submit" disabled={isPending} className={styles.searchButton}>
                <Search size={16} />
                {isPending ? 'Analyzing...' : 'Execute Search'}
              </Button>
            </form>
          </Form>
        </div>

        <div className={styles.resultsContainer}>
          {isPending && <ResultsSkeleton />}
          {isError && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>
                <AlertCircle size={48} />
              </div>
              <h2>System Error Detected</h2>
              <p>{error instanceof Error ? error.message : 'Unable to process search request. Please try again.'}</p>
            </div>
          )}
          {data && (
            <>
              {data.results.length === 0 ? (
                <div className={styles.noResults}>
                  <div className={styles.noResultsIcon}>
                    <Search size={64} />
                  </div>
                  <h3>No Matches Found</h3>
                  <p>Refine your search parameters to discover relevant entities.</p>
                </div>
              ) : (
                <>
                  <div className={styles.resultsHeader}>
                    <div className={styles.resultsStats}>
                      <span className={styles.resultsCount}>{data.results.length}</span>
                      <span className={styles.resultsOf}>of</span>
                      <span className={styles.resultsTotal}>{data.total}</span>
                      <span className={styles.resultsLabel}>entities detected</span>
                    </div>
                  </div>
                  <div className={styles.resultsTable}>
                    <div className={styles.tableHeader}>
                      <div>Name</div>
                      <div>Entity Type</div>
                      <div>Nationality</div>
                      <div>Source</div>
                      <div></div>
                    </div>
                    {data.results.map((entity) => (
                      <div key={entity.id} className={styles.tableRow}>
                        <div className={styles.nameCell}>{entity.name}</div>
                        <div>
                          <Badge 
                            variant={entity.entityType === 'INDIVIDUAL' ? 'secondary' : 'default'}
                            className={styles.entityBadge}
                          >
                            {entity.entityType}
                          </Badge>
                        </div>
                        <div>{entity.nationality || 'N/A'}</div>
                        <div>
                          <Badge variant="outline" className={styles.sourceBadge}>
                            {entity.listSource}
                          </Badge>
                        </div>
                        <div className={styles.viewCell}>
                          <Button asChild variant="link" size="sm">
                            <Link to={`/entity/${entity.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={data.page}
                    totalPages={data.totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

const ResultsSkeleton = () => (
  <div className={styles.skeletonContainer}>
    <div className={styles.resultsHeader}>
      <Skeleton style={{ width: '200px', height: '1.2rem' }} />
    </div>
    <div className={styles.resultsTable}>
      <div className={styles.tableHeader}>
        <Skeleton style={{ width: '100px', height: '1rem' }} />
        <Skeleton style={{ width: '80px', height: '1rem' }} />
        <Skeleton style={{ width: '80px', height: '1rem' }} />
        <Skeleton style={{ width: '60px', height: '1rem' }} />
        <Skeleton style={{ width: '80px', height: '1rem' }} />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <Skeleton style={{ width: '200px', height: '1.2rem' }} />
          <Skeleton style={{ width: '100px', height: '1.2rem' }} />
          <Skeleton style={{ width: '100px', height: '1.2rem' }} />
          <Skeleton style={{ width: '70px', height: '1.2rem' }} />
          <Skeleton style={{ width: '90px', height: '1.2rem' }} />
        </div>
      ))}
    </div>
  </div>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft size={16} />
        Previous
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

export default SearchPage;