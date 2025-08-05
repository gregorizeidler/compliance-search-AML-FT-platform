import { handle as handleAll } from "./all_POST";
import { schema, OutputType } from "./ofac_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { SanctionedEntities, SanctionsListSource, SyncHistory } from "../../helpers/schema";
import { Insertable } from "kysely";
import { XMLParser } from "fast-xml-parser";

interface OfacAddress {
  uid?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
}

interface OfacAka {
  uid?: string;
  type?: string;
  category?: string;
  lastName?: string;
  firstName?: string;
}

interface OfacDateOfBirth {
  uid?: string;
  dateOfBirth?: string;
  mainEntry?: boolean;
}

interface OfacPlaceOfBirth {
  uid?: string;
  placeOfBirth?: string;
  mainEntry?: boolean;
}

interface OfacNationality {
  uid?: string;
  country?: string;
  mainEntry?: boolean;
}

interface OfacProgram {
  "#text"?: string;
}

interface OfacSdnEntry {
  uid: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  sdnType?: string;
  programs?: OfacProgram | OfacProgram[];
  addressList?: OfacAddress | OfacAddress[];
  akaList?: OfacAka | OfacAka[];
  dateOfBirthList?: OfacDateOfBirth | OfacDateOfBirth[];
  placeOfBirthList?: OfacPlaceOfBirth | OfacPlaceOfBirth[];
  nationalityList?: OfacNationality | OfacNationality[];
  remarks?: string;
}

interface OfacXmlRoot {
  sdnList?: {
    sdnEntry?: OfacSdnEntry | OfacSdnEntry[];
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

function extractProgramText(programs: OfacProgram | OfacProgram[] | undefined): string[] {
  const programArray = normalizeArray(programs);
  return programArray
    .map(program => program["#text"] || "")
    .filter(text => text.trim().length > 0);
}

async function syncOfacData(): Promise<OutputType> {
  console.log("Starting OFAC data synchronization...");
  let recordsProcessed = 0;

  try {
    // Fetch OFAC SDN XML data from the official source
    console.log("Fetching OFAC XML data from official source...");
    const response = await fetch('https://www.treasury.gov/ofac/downloads/sdn.xml');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch OFAC data: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log("Fetched OFAC XML data, length:", xmlText.length);

    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error("Received empty XML data from OFAC");
    }

    // Parse XML using fast-xml-parser
    console.log("Parsing XML data...");
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: false,
    });

    let parsedData: OfacXmlRoot;
    try {
      parsedData = parser.parse(xmlText);
    } catch (parseError) {
      console.error("XML parsing error:", parseError);
      throw new Error(`Failed to parse OFAC XML data: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    console.log("Successfully parsed OFAC XML data");

    // Extract SDN entries
    const sdnListData = parsedData.sdnList;
    if (!sdnListData) {
      throw new Error("No sdnList found in OFAC XML data");
    }

    const sdnEntries = normalizeArray(sdnListData.sdnEntry);
    console.log(`Processing ${sdnEntries.length} SDN entries`);

    if (sdnEntries.length === 0) {
      const message = "No SDN entries found in OFAC data";
      await recordSyncHistory('OFAC', 'FAILED', message, 0);
      return { success: false, message };
    }

    // Map OFAC data to our database schema
    const entitiesToInsert: Insertable<SanctionedEntities>[] = sdnEntries.map((entry, index) => {
      // Build full name
      let name = '';
      if (entry.firstName && entry.lastName) {
        name = `${entry.firstName} ${entry.lastName}`;
      } else if (entry.lastName) {
        name = entry.lastName;
      } else if (entry.firstName) {
        name = entry.firstName;
      } else if (entry.title) {
        name = entry.title;
      } else {
        name = `Unknown Entity ${entry.uid}`;
      }

      // Build aliases array
      const aliases: string[] = [];
      const akaList = normalizeArray(entry.akaList);
      for (const aka of akaList) {
        let alias = '';
        if (aka.firstName && aka.lastName) {
          alias = `${aka.firstName} ${aka.lastName}`;
        } else if (aka.lastName) {
          alias = aka.lastName;
        } else if (aka.firstName) {
          alias = aka.firstName;
        }
        if (alias.trim()) {
          aliases.push(alias.trim());
        }
      }

      // Get addresses
      let addresses = null;
      const addressList = normalizeArray(entry.addressList);
      if (addressList.length > 0) {
        addresses = addressList.map(addr => ({
          address1: addr.address1 || null,
          address2: addr.address2 || null,
          address3: addr.address3 || null,
          city: addr.city || null,
          stateOrProvince: addr.stateOrProvince || null,
          postalCode: addr.postalCode || null,
          country: addr.country || null,
        }));
      }

      // Get date of birth
      let dateOfBirth: Date | null = null;
      const dobList = normalizeArray(entry.dateOfBirthList);
      const mainDob = dobList.find(dob => dob.mainEntry) || dobList[0];
      if (mainDob?.dateOfBirth) {
        try {
          dateOfBirth = new Date(mainDob.dateOfBirth);
          // Validate the date
          if (isNaN(dateOfBirth.getTime())) {
            console.warn(`Invalid date of birth for ${entry.uid}: ${mainDob.dateOfBirth}`);
            dateOfBirth = null;
          }
        } catch (e) {
          console.warn(`Invalid date of birth for ${entry.uid}: ${mainDob.dateOfBirth}`);
          dateOfBirth = null;
        }
      }

      // Get place of birth
      const pobList = normalizeArray(entry.placeOfBirthList);
      const mainPob = pobList.find(pob => pob.mainEntry) || pobList[0];
      const placeOfBirth = mainPob?.placeOfBirth || null;

      // Get nationality
      const nationalityList = normalizeArray(entry.nationalityList);
      const mainNationality = nationalityList.find(nat => nat.mainEntry) || nationalityList[0];
      const nationality = mainNationality?.country || null;

      // Build reason from programs
      const programTexts = extractProgramText(entry.programs);
      const reason = programTexts.length > 0 ? programTexts.join(', ') : null;

      // Determine entity type
      let entityType: 'INDIVIDUAL' | 'ENTITY' = 'ENTITY';
      if (entry.sdnType) {
        const sdnTypeLower = entry.sdnType.toLowerCase();
        if (sdnTypeLower.includes('individual') || sdnTypeLower.includes('person')) {
          entityType = 'INDIVIDUAL';
        }
      }

      return {
        listSource: 'OFAC' as SanctionsListSource,
        entityType,
        name: name.trim(),
        referenceNumber: entry.uid,
        aliases: aliases.length > 0 ? aliases : null,
        addresses: addresses,
        dateOfBirth,
        placeOfBirth,
        nationality,
        reason,
        additionalInfo: entry.remarks || null,
        dateAdded: new Date(), // Use current date as we don't have the original date added
      };
    });

    console.log(`Mapped ${entitiesToInsert.length} entities for insertion`);
    recordsProcessed = entitiesToInsert.length;

    // Use a transaction to delete old OFAC data and insert new data
    await db.transaction().execute(async (trx) => {
      console.log("Deleting existing OFAC data...");
      const deleteResult = await trx.deleteFrom('sanctionedEntities').where('listSource', '=', 'OFAC').execute();
      console.log(`Deleted ${deleteResult.length} existing OFAC records`);
      
      if (entitiesToInsert.length > 0) {
        console.log("Inserting new OFAC data...");
        // Insert in batches to avoid potential issues with large datasets
        const batchSize = 1000;
        for (let i = 0; i < entitiesToInsert.length; i += batchSize) {
          const batch = entitiesToInsert.slice(i, i + batchSize);
          await trx.insertInto('sanctionedEntities').values(batch).execute();
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(entitiesToInsert.length / batchSize)}`);
        }
      }
    });

    const message = `OFAC data synchronization completed successfully. ${entitiesToInsert.length} entities processed.`;
    console.log(message);
    
    // Record successful sync in history
    await recordSyncHistory('OFAC', 'SUCCESS', message, recordsProcessed);
    
    return { success: true, message };

  } catch (error) {
    console.error("Error during OFAC sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during OFAC synchronization";
    
    // Record failed sync in history
    await recordSyncHistory('OFAC', 'FAILED', `OFAC sync failed: ${errorMessage}`, 0);
    
    return { success: false, message: `OFAC sync failed: ${errorMessage}` };
  }
}

export async function handle(request: Request): Promise<Response> {
  try {
    const result = await syncOfacData();
    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during OFAC sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Record failed sync in history for top-level errors
    await recordSyncHistory('OFAC', 'FAILED', `OFAC sync failed: ${errorMessage}`, 0);
    
    return new Response(superjson.stringify({ success: false, message: `OFAC sync failed: ${errorMessage}` }), { status: 500 });
  }
}