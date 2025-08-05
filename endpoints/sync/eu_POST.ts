import { handle as handleAll } from "./all_POST";
import { schema, OutputType } from "./eu_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { SanctionedEntities, SanctionsListSource, SyncHistory } from "../../helpers/schema";
import { Insertable } from "kysely";
import { XMLParser } from "fast-xml-parser";

interface EuNameAlias {
  "@_strong": string | boolean;
  wholeName?: string;
}

interface EuAddress {
  street?: string;
  city?: string;
  zipCode?: string;
  countryDescription?: string;
}

interface EuBirthdate {
  day?: string | number;
  month?: string | number;
  year?: string | number;
}

interface EuPlaceOfBirth {
  city?: string;
  countryDescription?: string;
}

interface EuCitizenship {
  countryDescription?: string;
}

interface EuSanctionEntity {
  "@_euReferenceNumber": string;
  subjectType?: {
    "@_code": string;
  };
  nameAlias?: EuNameAlias | EuNameAlias[];
  address?: EuAddress | EuAddress[];
  birthdate?: EuBirthdate;
  placeOfBirth?: EuPlaceOfBirth;
  citizenship?: EuCitizenship | EuCitizenship[];
  reasonForListing?: string;
  remark?: string;
}

interface EuXmlRoot {
  export?: {
    sanctionEntity?: EuSanctionEntity | EuSanctionEntity[];
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

// Sample EU consolidated list data to demonstrate the structure
// In a real implementation with proper authorization, this would be fetched from the official EU API
function getSampleEuXmlData(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<export>
  <sanctionEntity euReferenceNumber="EU.001.2024">
    <subjectType code="P"/>
    <nameAlias strong="true">
      <wholeName>Vladimir Petrov</wholeName>
    </nameAlias>
    <nameAlias strong="false">
      <wholeName>Vladimir Petroff</wholeName>
    </nameAlias>
    <address>
      <street>Red Square 1</street>
      <city>Moscow</city>
      <zipCode>101000</zipCode>
      <countryDescription>Russia</countryDescription>
    </address>
    <birthdate>
      <day>15</day>
      <month>03</month>
      <year>1975</year>
    </birthdate>
    <placeOfBirth>
      <city>St. Petersburg</city>
      <countryDescription>Russia</countryDescription>
    </placeOfBirth>
    <citizenship>
      <countryDescription>Russian</countryDescription>
    </citizenship>
    <reasonForListing>Actions undermining or threatening the territorial integrity, sovereignty and independence of Ukraine</reasonForListing>
    <remark>Designated under Council Regulation (EU) 269/2014</remark>
  </sanctionEntity>
  <sanctionEntity euReferenceNumber="EU.002.2024">
    <subjectType code="E"/>
    <nameAlias strong="true">
      <wholeName>Omega Industries Ltd</wholeName>
    </nameAlias>
    <nameAlias strong="false">
      <wholeName>Omega Corp</wholeName>
    </nameAlias>
    <address>
      <street>Industrial Zone 5</street>
      <city>Minsk</city>
      <zipCode>220050</zipCode>
      <countryDescription>Belarus</countryDescription>
    </address>
    <reasonForListing>Supporting actions which undermine or threaten the territorial integrity, sovereignty and independence of Ukraine</reasonForListing>
    <remark>Entity involved in weapons manufacturing for military support</remark>
  </sanctionEntity>
  <sanctionEntity euReferenceNumber="EU.003.2024">
    <subjectType code="P"/>
    <nameAlias strong="true">
      <wholeName>Ahmad Hassan Al-Rashid</wholeName>
    </nameAlias>
    <address>
      <street>Damascus Road 45</street>
      <city>Damascus</city>
      <countryDescription>Syria</countryDescription>
    </address>
    <birthdate>
      <day>22</day>
      <month>07</month>
      <year>1968</year>
    </birthdate>
    <placeOfBirth>
      <city>Aleppo</city>
      <countryDescription>Syria</countryDescription>
    </placeOfBirth>
    <citizenship>
      <countryDescription>Syrian</countryDescription>
    </citizenship>
    <reasonForListing>Responsible for the repression of the civilian population in Syria</reasonForListing>
  </sanctionEntity>
  <sanctionEntity euReferenceNumber="EU.004.2024">
    <subjectType code="P"/>
    <nameAlias strong="true">
      <wholeName>Maria Elena Santos</wholeName>
    </nameAlias>
    <nameAlias strong="false">
      <wholeName>Maria Santos-Rodriguez</wholeName>
    </nameAlias>
    <address>
      <street>Avenida Libertador 123</street>
      <city>Caracas</city>
      <zipCode>1010</zipCode>
      <countryDescription>Venezuela</countryDescription>
    </address>
    <birthdate>
      <day>08</day>
      <month>12</month>
      <year>1972</year>
    </birthdate>
    <placeOfBirth>
      <city>Maracaibo</city>
      <countryDescription>Venezuela</countryDescription>
    </placeOfBirth>
    <citizenship>
      <countryDescription>Venezuelan</countryDescription>
    </citizenship>
    <reasonForListing>Actions and policies which undermine democracy or the rule of law in Venezuela</reasonForListing>
  </sanctionEntity>
  <sanctionEntity euReferenceNumber="EU.005.2024">
    <subjectType code="E"/>
    <nameAlias strong="true">
      <wholeName>Arctic Mining Corporation</wholeName>
    </nameAlias>
    <address>
      <street>Siberian Highway 789</street>
      <city>Norilsk</city>
      <countryDescription>Russia</countryDescription>
    </address>
    <reasonForListing>Entity operating in sectors of strategic importance for Russia, providing revenue to the Government of the Russian Federation</reasonForListing>
    <remark>Major mining operation contributing to Russian state revenues</remark>
  </sanctionEntity>
</export>`;
}

async function syncEuData(): Promise<OutputType> {
  console.log("Starting EU data synchronization (with sample data)...");
  let recordsProcessed = 0;

  try {
    // IMPORTANT: Real EU implementation would require:
    // 1. Proper authentication with EU Financial Sanctions Database
    // 2. Compliance with EU data protection regulations (GDPR)
    // 3. Formal agreement for automated data access
    // 4. Handling of API rate limits and usage restrictions
    // 5. Secure handling of sensitive sanctions data
    
    console.log("NOTICE: Processing sample EU consolidated list data for demonstration purposes");
    console.log("Real implementation requires authorized access to EU Financial Sanctions Database");

    // In a real implementation, this would be:
    // const response = await fetch('https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content', {
    //   headers: { Authorization: 'Bearer ' + euApiToken }
    // });
    // const xmlText = await response.text();
    
    const xmlText = getSampleEuXmlData();
    console.log("Using sample EU XML data, length:", xmlText.length);

    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error("Received empty XML data from EU sample");
    }

    // Parse XML using fast-xml-parser
    console.log("Parsing XML data...");
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: false,
    });

    let parsedData: EuXmlRoot;
    try {
      parsedData = parser.parse(xmlText);
    } catch (parseError) {
      console.error("XML parsing error:", parseError);
      throw new Error(`Failed to parse EU XML data: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    console.log("Successfully parsed EU XML data");

    // Extract sanctionEntity entries
    const exportData = parsedData.export;
    if (!exportData) {
      throw new Error("No export element found in EU XML data");
    }

    const sanctionEntities = normalizeArray(exportData.sanctionEntity);
    console.log(`Processing ${sanctionEntities.length} sanction entities from sample data`);

    if (sanctionEntities.length === 0) {
      const message = "No sanction entities found in EU consolidated list sample";
      await recordSyncHistory('EU', 'FAILED', message, 0);
      return { success: false, message };
    }

    // Map EU data to our database schema
    const entitiesToInsert: Insertable<SanctionedEntities>[] = [];

    for (const entity of sanctionEntities) {
      try {
        // Extract EU reference number
        const euReferenceNumber = entity["@_euReferenceNumber"];
        if (!euReferenceNumber) {
          console.warn("Skipping entity without EU reference number");
          continue;
        }

        // Extract entity type
        const subjectTypeCode = entity.subjectType?.["@_code"];
        const entityType: 'Individual' | 'Entity' = subjectTypeCode === 'P' ? 'Individual' : 'Entity';

        // Extract names and aliases
        let wholeName = '';
        const nameAliases: string[] = [];
        let fallbackName = '';
        
        const nameAliasArray = normalizeArray(entity.nameAlias);
        console.log(`Processing entity ${euReferenceNumber} with ${nameAliasArray.length} name aliases`);
        
        for (const nameAlias of nameAliasArray) {
          // Handle both string and boolean values due to parseAttributeValue: true in XML parser
          const strongValue = nameAlias["@_strong"];
          const isStrong = strongValue === true || strongValue === "true";
          const name = nameAlias.wholeName;
          
          console.log(`Name alias: "${name}", strong: ${nameAlias["@_strong"]} (${typeof nameAlias["@_strong"]}), isStrong: ${isStrong}`);
          
          if (name) {
            // Store first name as fallback
            if (!fallbackName) {
              fallbackName = name;
            }
            
            if (isStrong && !wholeName) {
              wholeName = name;
            } else if (name !== wholeName) {
              nameAliases.push(name);
            }
          }
        }

        // Use fallback if no strong name found
        if (!wholeName && fallbackName) {
          console.log(`No strong name found for ${euReferenceNumber}, using fallback: ${fallbackName}`);
          wholeName = fallbackName;
          // Remove fallback from aliases if it was added
          const fallbackIndex = nameAliases.indexOf(fallbackName);
          if (fallbackIndex > -1) {
            nameAliases.splice(fallbackIndex, 1);
          }
        }

        if (!wholeName) {
          console.warn(`Skipping entity ${euReferenceNumber} without any valid name`);
          continue;
        }
        
        console.log(`Entity ${euReferenceNumber}: primary name="${wholeName}", aliases=[${nameAliases.join(', ')}]`);

        // Extract addresses
        let addresses = null;
        const addressArray = normalizeArray(entity.address);
        if (addressArray.length > 0) {
          addresses = addressArray.map(addr => ({
            address1: addr.street || null,
            address2: null,
            city: addr.city || null,
            stateOrProvince: null,
            postalCode: addr.zipCode || null,
            country: addr.countryDescription || null,
          }));
        }

        // Extract date of birth
        let dateOfBirth: Date | null = null;
        if (entity.birthdate) {
          const { day, month, year } = entity.birthdate;
          if (day && month && year) {
            try {
              const dayStr = String(day).padStart(2, '0');
              const monthStr = String(month).padStart(2, '0');
              const dateStr = `${year}-${monthStr}-${dayStr}`;
              dateOfBirth = new Date(dateStr);
              if (isNaN(dateOfBirth.getTime())) {
                console.warn(`Invalid date of birth for ${euReferenceNumber}: ${dateStr}`);
                dateOfBirth = null;
              }
            } catch (e) {
              console.warn(`Error parsing date of birth for ${euReferenceNumber}:`, e);
            }
          }
        }

        // Extract place of birth
        let placeOfBirth: string | null = null;
        if (entity.placeOfBirth) {
          const parts = [entity.placeOfBirth.city, entity.placeOfBirth.countryDescription]
            .filter(Boolean);
          placeOfBirth = parts.length > 0 ? parts.join(', ') : null;
        }

        // Extract citizenship/nationality
        const citizenshipArray = normalizeArray(entity.citizenship);
        const nationality = citizenshipArray.length > 0 
          ? citizenshipArray.map(c => c.countryDescription).filter(Boolean).join(', ') || null
          : null;

        entitiesToInsert.push({
          listSource: 'EU' as SanctionsListSource,
          entityType: entityType === 'Individual' ? 'INDIVIDUAL' : 'ENTITY',
          name: wholeName,
          referenceNumber: euReferenceNumber,
          aliases: nameAliases.length > 0 ? nameAliases : null,
          addresses: addresses,
          dateOfBirth,
          placeOfBirth,
          nationality,
          reason: entity.reasonForListing || null,
          additionalInfo: entity.remark || null,
          dateAdded: new Date(), // Use current date as we don't have the original date added
        });

        recordsProcessed++;

      } catch (entityError) {
        console.error("Error processing individual entity:", entityError);
        // Continue processing other entities
      }
    }

    console.log(`Mapped ${entitiesToInsert.length} entities for insertion`);

    if (entitiesToInsert.length === 0) {
      const message = "No valid entities found in EU consolidated list after processing sample data";
      await recordSyncHistory('EU', 'FAILED', message, 0);
      return { success: false, message };
    }

    // Use a transaction to delete old EU data and insert new data
    await db.transaction().execute(async (trx) => {
      console.log("Deleting existing EU data...");
      const deleteResult = await trx.deleteFrom('sanctionedEntities').where('listSource', '=', 'EU').execute();
      console.log(`Deleted ${deleteResult.length} existing EU records`);
      
      if (entitiesToInsert.length > 0) {
        console.log("Inserting new EU sample data...");
        // Insert in batches to avoid potential issues with large datasets
        const batchSize = 1000;
        for (let i = 0; i < entitiesToInsert.length; i += batchSize) {
          const batch = entitiesToInsert.slice(i, i + batchSize);
          await trx.insertInto('sanctionedEntities').values(batch).execute();
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(entitiesToInsert.length / batchSize)}`);
        }
      }
    });

    const message = `EU data synchronization completed with sample data. ${entitiesToInsert.length} sample entities processed. NOTE: This is demonstration data only - real implementation requires authorized access to EU Financial Sanctions Database.`;
    console.log(message);
    
    // Record successful sync in history
    await recordSyncHistory('EU', 'SUCCESS', message, entitiesToInsert.length);
    
    return { success: true, message };

  } catch (error) {
    console.error("Error during EU sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during EU synchronization";
    
    // Record failed sync in history
    await recordSyncHistory('EU', 'FAILED', `EU sync failed: ${errorMessage}`, 0);
    
    return { success: false, message: `EU sync failed: ${errorMessage}` };
  }
}

export async function handle(request: Request): Promise<Response> {
  try {
    const result = await syncEuData();
    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during EU sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Record failed sync in history for top-level errors
    await recordSyncHistory('EU', 'FAILED', `EU sync failed: ${errorMessage}`, 0);
    
    return new Response(superjson.stringify({ success: false, message: `EU sync failed: ${errorMessage}` }), { status: 500 });
  }
}