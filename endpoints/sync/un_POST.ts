import { handle as handleAll } from "./all_POST";
import { schema, OutputType } from "./un_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { SanctionedEntities, SanctionsListSource, SyncHistory } from "../../helpers/schema";
import { Insertable } from "kysely";
import { XMLParser } from "fast-xml-parser";

interface UnName {
  FIRST_NAME?: string;
  SECOND_NAME?: string;
  THIRD_NAME?: string;
  FOURTH_NAME?: string;
}

interface UnAlias {
  ALIAS_NAME?: string;
  QUALITY?: string;
}

interface UnAddress {
  STREET?: string;
  CITY?: string;
  STATE_PROVINCE?: string;
  COUNTRY?: string;
}

interface UnDesignation {
  VALUE?: string;
}

interface UnNationality {
  VALUE?: string;
}

interface UnDateOfBirth {
  DATE?: string;
  TYPE_OF_DATE?: string;
}

interface UnPlaceOfBirth {
  VALUE?: string;
}

interface UnIndividual extends UnName {
  "@_dataid": string;
  UN_LIST_TYPE?: string;
  REFERENCE_NUMBER?: string;
  LISTED_ON?: string;
  NAME_ORIGINAL_SCRIPT?: string;
  COMMENTS1?: string;
  DESIGNATION?: UnDesignation | UnDesignation[];
  NATIONALITY?: UnNationality | UnNationality[];
  INDIVIDUAL_DATE_OF_BIRTH?: UnDateOfBirth | UnDateOfBirth[];
  INDIVIDUAL_PLACE_OF_BIRTH?: UnPlaceOfBirth | UnPlaceOfBirth[];
  INDIVIDUAL_ALIAS?: UnAlias | UnAlias[];
  INDIVIDUAL_ADDRESS?: UnAddress | UnAddress[];
}

interface UnEntity extends UnName {
  "@_dataid": string;
  UN_LIST_TYPE?: string;
  REFERENCE_NUMBER?: string;
  LISTED_ON?: string;
  COMMENTS1?: string;
  ENTITY_ALIAS?: UnAlias | UnAlias[];
  ENTITY_ADDRESS?: UnAddress | UnAddress[];
}

interface UnXmlRoot {
  CONSOLIDATED_LIST?: {
    INDIVIDUALS?: {
      INDIVIDUAL?: UnIndividual | UnIndividual[];
    };
    ENTITIES?: {
      ENTITY?: UnEntity | UnEntity[];
    };
  };
}

async function recordSyncHistory(
  source: string,
  status: 'SUCCESS' | 'FAILED',
  message: string,
  recordsAffected: number = 0
): Promise<void> {
  try {
    const syncHistoryRecord: Insertable<SyncHistory> = {
      source,
      status,
      message,
      recordsAffected,
      createdAt: new Date(),
    };

    await db.insertInto('syncHistory').values(syncHistoryRecord).execute();
    console.log(`Sync history recorded: ${status} - ${recordsAffected} records`);
  } catch (error) {
    console.error("Failed to record sync history:", error);
    // Don't throw here to avoid masking the original sync result
  }
}

function normalizeArray<T>(item: T | T[] | undefined): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function buildFullName(individual: UnName): string {
  const nameParts = [
    individual.FIRST_NAME,
    individual.SECOND_NAME,
    individual.THIRD_NAME,
    individual.FOURTH_NAME
  ].filter(Boolean);
  
  return nameParts.length > 0 ? nameParts.join(' ') : '';
}

function extractAliases(aliases: UnAlias | UnAlias[] | undefined): string[] {
  const aliasArray = normalizeArray(aliases);
  return aliasArray
    .map(alias => alias.ALIAS_NAME)
    .filter((name): name is string => Boolean(name?.trim()));
}

function extractAddresses(addresses: UnAddress | UnAddress[] | undefined) {
  const addressArray = normalizeArray(addresses);
  if (addressArray.length === 0) return null;

  return addressArray.map(addr => ({
    address1: addr.STREET || null,
    address2: null,
    city: addr.CITY || null,
    stateOrProvince: addr.STATE_PROVINCE || null,
    postalCode: null,
    country: addr.COUNTRY || null,
  }));
}

function extractDesignation(designations: UnDesignation | UnDesignation[] | undefined): string | null {
  const designationArray = normalizeArray(designations);
  const values = designationArray
    .map(d => d.VALUE)
    .filter(Boolean);
  
  return values.length > 0 ? values.join(', ') : null;
}

function extractNationality(nationalities: UnNationality | UnNationality[] | undefined): string | null {
  const nationalityArray = normalizeArray(nationalities);
  const values = nationalityArray
    .map(n => n.VALUE)
    .filter(Boolean);
  
  return values.length > 0 ? values.join(', ') : null;
}

function extractDateOfBirth(dobs: UnDateOfBirth | UnDateOfBirth[] | undefined): Date | null {
  const dobArray = normalizeArray(dobs);
  if (dobArray.length === 0) return null;

  const dob = dobArray[0];
  if (!dob.DATE) return null;

  try {
    const date = new Date(dob.DATE);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date of birth: ${dob.DATE}`);
      return null;
    }
    return date;
  } catch (e) {
    console.warn(`Invalid date of birth: ${dob.DATE}`);
    return null;
  }
}

function extractPlaceOfBirth(pobs: UnPlaceOfBirth | UnPlaceOfBirth[] | undefined): string | null {
  const pobArray = normalizeArray(pobs);
  if (pobArray.length === 0) return null;

  const pob = pobArray[0];
  return pob.VALUE || null;
}

function parseDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return new Date(); // Fallback to current date
    }
    return date;
  } catch (e) {
    console.warn(`Invalid date: ${dateString}`);
    return new Date(); // Fallback to current date
  }
}

async function syncUnData(): Promise<OutputType> {
  console.log("Starting UN data synchronization...");
  let recordsProcessed = 0;

  try {
    // Fetch UN consolidated list XML data
    console.log("Fetching UN XML data from official source...");
    const response = await fetch('https://scsanctions.un.org/resources/xml/en/consolidated.xml');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch UN data: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log("Fetched UN XML data, length:", xmlText.length);

    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error("Received empty XML data from UN");
    }

    // Parse XML using fast-xml-parser
    console.log("Parsing XML data...");
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: false,
    });

    let parsedData: UnXmlRoot;
    try {
      parsedData = parser.parse(xmlText);
    } catch (parseError) {
      console.error("XML parsing error:", parseError);
      throw new Error(`Failed to parse UN XML data: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    console.log("Successfully parsed UN XML data");

    // Extract individuals and entities
    const consolidatedList = parsedData.CONSOLIDATED_LIST;
    if (!consolidatedList) {
      throw new Error("No CONSOLIDATED_LIST found in UN XML data");
    }

    const individuals = normalizeArray(consolidatedList.INDIVIDUALS?.INDIVIDUAL);
    const entities = normalizeArray(consolidatedList.ENTITIES?.ENTITY);
    
    console.log(`Processing ${individuals.length} individuals and ${entities.length} entities`);

    if (individuals.length === 0 && entities.length === 0) {
      const message = "No individuals or entities found in UN consolidated list";
      await recordSyncHistory('UN', 'FAILED', message, 0);
      return { success: false, message };
    }

    // Map UN data to our database schema
    const entitiesToInsert: Insertable<SanctionedEntities>[] = [];

    // Process individuals
    for (const individual of individuals) {
      const name = buildFullName(individual);
      const finalName = name || `Unknown Individual ${individual["@_dataid"]}`;

      const aliases = extractAliases(individual.INDIVIDUAL_ALIAS);
      const addresses = extractAddresses(individual.INDIVIDUAL_ADDRESS);
      const dateOfBirth = extractDateOfBirth(individual.INDIVIDUAL_DATE_OF_BIRTH);
      const placeOfBirth = extractPlaceOfBirth(individual.INDIVIDUAL_PLACE_OF_BIRTH);
      const nationality = extractNationality(individual.NATIONALITY);
      const designation = extractDesignation(individual.DESIGNATION);
      const dateAdded = parseDate(individual.LISTED_ON);

      entitiesToInsert.push({
        listSource: 'UN' as SanctionsListSource,
        entityType: 'INDIVIDUAL',
        name: finalName,
        referenceNumber: individual.REFERENCE_NUMBER || individual["@_dataid"],
        aliases: aliases.length > 0 ? aliases : null,
        addresses: addresses,
        dateOfBirth,
        placeOfBirth,
        nationality,
        reason: individual.UN_LIST_TYPE || designation,
        additionalInfo: individual.COMMENTS1 || null,
        dateAdded: dateAdded || new Date(),
      });
    }

    // Process entities
    for (const entity of entities) {
      const name = buildFullName(entity);
      const finalName = name || `Unknown Entity ${entity["@_dataid"]}`;

      const aliases = extractAliases(entity.ENTITY_ALIAS);
      const addresses = extractAddresses(entity.ENTITY_ADDRESS);
      const dateAdded = parseDate(entity.LISTED_ON);

      entitiesToInsert.push({
        listSource: 'UN' as SanctionsListSource,
        entityType: 'ENTITY',
        name: finalName,
        referenceNumber: entity.REFERENCE_NUMBER || entity["@_dataid"],
        aliases: aliases.length > 0 ? aliases : null,
        addresses: addresses,
        dateOfBirth: null,
        placeOfBirth: null,
        nationality: null,
        reason: entity.UN_LIST_TYPE || null,
        additionalInfo: entity.COMMENTS1 || null,
        dateAdded: dateAdded || new Date(),
      });
    }

    console.log(`Mapped ${entitiesToInsert.length} entities for insertion`);
    recordsProcessed = entitiesToInsert.length;

    // Use a transaction to delete old UN data and insert new data
    await db.transaction().execute(async (trx) => {
      console.log("Deleting existing UN data...");
      const deleteResult = await trx.deleteFrom('sanctionedEntities').where('listSource', '=', 'UN').execute();
      console.log(`Deleted ${deleteResult.length} existing UN records`);
      
      if (entitiesToInsert.length > 0) {
        console.log("Inserting new UN data...");
        // Insert in batches to avoid potential issues with large datasets
        const batchSize = 1000;
        for (let i = 0; i < entitiesToInsert.length; i += batchSize) {
          const batch = entitiesToInsert.slice(i, i + batchSize);
          await trx.insertInto('sanctionedEntities').values(batch).execute();
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(entitiesToInsert.length / batchSize)}`);
        }
      }
    });

    const message = `UN data synchronization completed successfully. ${entitiesToInsert.length} entities processed.`;
    console.log(message);
    
    // Record successful sync in history
    await recordSyncHistory('UN', 'SUCCESS', message, recordsProcessed);
    
    return { success: true, message };

  } catch (error) {
    console.error("Error during UN sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during UN synchronization";
    
    // Record failed sync in history
    await recordSyncHistory('UN', 'FAILED', `UN sync failed: ${errorMessage}`, 0);
    
    return { success: false, message: `UN sync failed: ${errorMessage}` };
  }
}

export async function handle(request: Request): Promise<Response> {
  try {
    const result = await syncUnData();
    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during UN sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Record failed sync in history for top-level errors
    await recordSyncHistory('UN', 'FAILED', `UN sync failed: ${errorMessage}`, 0);
    
    return new Response(superjson.stringify({ success: false, message: `UN sync failed: ${errorMessage}` }), { status: 500 });
  }
}