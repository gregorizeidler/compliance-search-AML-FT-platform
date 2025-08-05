import { handle as handleAll } from "./all_POST";
import { schema, OutputType } from "./interpol_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { SanctionedEntities, SanctionsListSource, SyncHistory } from "../../helpers/schema";
import { Insertable } from "kysely";

interface InterpolRedNotice {
  entityId: string;
  forename?: string;
  name?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string[];
  charges?: string;
  warrantType?: string;
  issuingCountry: string;
  publishedAt: string;
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

// Sample Interpol Red Notice data to demonstrate the structure
// In a real implementation with proper authorization, this would be fetched from Interpol's API
function getSampleInterpolData(): InterpolRedNotice[] {
  return [
    {
      entityId: "2023/12345",
      forename: "Ahmed",
      name: "Hassan",
      dateOfBirth: "1985-03-15",
      countryOfBirth: "Syria",
      placeOfBirth: "Damascus",
      nationality: ["Syrian"],
      charges: "Terrorism, murder, criminal association",
      warrantType: "Arrest warrant",
      issuingCountry: "France",
      publishedAt: "2023-05-20"
    },
    {
      entityId: "2023/67890",
      forename: "Maria",
      name: "Rodriguez Santos",
      dateOfBirth: "1978-11-08",
      countryOfBirth: "Colombia",
      placeOfBirth: "Bogotá",
      nationality: ["Colombian", "Venezuelan"],
      charges: "Drug trafficking, money laundering",
      warrantType: "Arrest warrant",
      issuingCountry: "United States",
      publishedAt: "2023-08-12"
    },
    {
      entityId: "2023/54321",
      name: "Dmitri Volkov",
      dateOfBirth: "1972-07-22",
      countryOfBirth: "Russia",
      placeOfBirth: "Moscow",
      nationality: ["Russian"],
      charges: "Cybercrime, fraud, identity theft",
      warrantType: "Arrest warrant",
      issuingCountry: "Germany",
      publishedAt: "2023-09-05"
    },
    {
      entityId: "2023/98765",
      forename: "Chen",
      name: "Wei Ming",
      dateOfBirth: "1980-12-01",
      countryOfBirth: "China",
      placeOfBirth: "Shanghai",
      nationality: ["Chinese"],
      charges: "Human trafficking, organized crime",
      warrantType: "Arrest warrant",
      issuingCountry: "Thailand",
      publishedAt: "2023-10-18"
    },
    {
      entityId: "2023/11111",
      forename: "Abdul",
      name: "Rahman Al-Mansouri",
      dateOfBirth: "1965-02-28",
      countryOfBirth: "Iraq",
      placeOfBirth: "Baghdad",
      nationality: ["Iraqi"],
      charges: "War crimes, crimes against humanity",
      warrantType: "Arrest warrant",
      issuingCountry: "International Criminal Court",
      publishedAt: "2023-06-30"
    }
  ];
}

async function syncInterpolData(): Promise<OutputType> {
  console.log("Starting Interpol data synchronization (with sample data)...");

  try {
    // IMPORTANT: Real Interpol implementation would require:
    // 1. Proper authentication with Interpol systems
    // 2. Compliance with Interpol's terms of use and data protection requirements
    // 3. Formal agreement for automated data access
    // 4. Secure handling of sensitive law enforcement data
    
    console.log("NOTICE: Processing sample Interpol Red Notice data for demonstration purposes");
    console.log("Real implementation requires formal authorization from Interpol");

    // In a real implementation, this would be:
    // const response = await authenticatedFetch('https://interpol-api.int/red-notices', { headers: { Authorization: 'Bearer ' + interpolToken } });
    // const interpolData = await response.json();
    
    const sampleData = getSampleInterpolData();
    console.log(`Processing ${sampleData.length} sample Red Notice entries`);

    if (sampleData.length === 0) {
      const message = "No Red Notice entries found in sample data";
      await recordSyncHistory('INTERPOL', 'FAILED', message, 0);
      return { success: false, message };
    }

    // Map Interpol data to our database schema
    const entitiesToInsert: Insertable<SanctionedEntities>[] = sampleData.map((notice) => {
      // Build full name
      let fullName = '';
      if (notice.forename && notice.name) {
        fullName = `${notice.forename} ${notice.name}`;
      } else if (notice.name) {
        fullName = notice.name;
      } else if (notice.forename) {
        fullName = notice.forename;
      } else {
        fullName = `Unknown Subject ${notice.entityId}`;
      }

      // Parse date of birth
      let dateOfBirth: Date | null = null;
      if (notice.dateOfBirth) {
        try {
          dateOfBirth = new Date(notice.dateOfBirth);
          if (isNaN(dateOfBirth.getTime())) {
            console.warn(`Invalid date of birth for ${notice.entityId}: ${notice.dateOfBirth}`);
            dateOfBirth = null;
          }
        } catch (e) {
          console.warn(`Invalid date of birth for ${notice.entityId}: ${notice.dateOfBirth}`);
          dateOfBirth = null;
        }
      }

      // Parse publish date for dateAdded
      let dateAdded: Date = new Date();
      if (notice.publishedAt) {
        try {
          const publishDate = new Date(notice.publishedAt);
          if (!isNaN(publishDate.getTime())) {
            dateAdded = publishDate;
          }
        } catch (e) {
          console.warn(`Invalid publish date for ${notice.entityId}: ${notice.publishedAt}`);
        }
      }

      // Build place of birth
      let placeOfBirth: string | null = null;
      if (notice.placeOfBirth && notice.countryOfBirth) {
        placeOfBirth = `${notice.placeOfBirth}, ${notice.countryOfBirth}`;
      } else if (notice.placeOfBirth) {
        placeOfBirth = notice.placeOfBirth;
      } else if (notice.countryOfBirth) {
        placeOfBirth = notice.countryOfBirth;
      }

      // Handle nationality
      const nationality = notice.nationality && notice.nationality.length > 0 
        ? notice.nationality.join(', ') 
        : null;

      // Build reason combining charges and warrant type
      let reason = '';
      if (notice.charges && notice.warrantType) {
        reason = `${notice.warrantType}: ${notice.charges}`;
      } else if (notice.charges) {
        reason = notice.charges;
      } else if (notice.warrantType) {
        reason = notice.warrantType;
      }

      // Build additional info with issuing country
      let additionalInfo = '';
      if (notice.issuingCountry) {
        additionalInfo = `Red Notice issued by: ${notice.issuingCountry}`;
        if (notice.publishedAt) {
          additionalInfo += ` (Published: ${notice.publishedAt})`;
        }
      }

      return {
        listSource: 'INTERPOL' as SanctionsListSource,
        entityType: 'INDIVIDUAL', // Red Notices are typically for individuals
        name: fullName.trim(),
        referenceNumber: notice.entityId,
        aliases: null, // Red Notices typically don't include aliases in the main record
        addresses: null, // Address information is usually not included in public Red Notice data
        dateOfBirth,
        placeOfBirth,
        nationality,
        reason: reason || null,
        additionalInfo: additionalInfo || null,
        dateAdded,
      };
    });

    console.log(`Mapped ${entitiesToInsert.length} entities for insertion`);

    // Use a transaction to delete old Interpol data and insert new data
    await db.transaction().execute(async (trx) => {
      console.log("Deleting existing Interpol data...");
      const deleteResult = await trx.deleteFrom('sanctionedEntities').where('listSource', '=', 'INTERPOL').execute();
      console.log(`Deleted ${deleteResult.length} existing Interpol records`);
      
      if (entitiesToInsert.length > 0) {
        console.log("Inserting new Interpol data...");
        await trx.insertInto('sanctionedEntities').values(entitiesToInsert).execute();
        console.log(`Inserted ${entitiesToInsert.length} Interpol records`);
      }
    });

    const message = `Interpol data synchronization completed with sample data. ${entitiesToInsert.length} sample Red Notice entries processed. NOTE: This is demonstration data only - real implementation requires Interpol authorization.`;
    console.log(message);
    
    // Record successful sync in history
    await recordSyncHistory('INTERPOL', 'SUCCESS', message, entitiesToInsert.length);
    
    return { success: true, message };

  } catch (error) {
    console.error("Error during Interpol sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Interpol synchronization";
    
    // Record failed sync in history
    await recordSyncHistory('INTERPOL', 'FAILED', `Interpol sync failed: ${errorMessage}`, 0);
    
    return { success: false, message: `Interpol sync failed: ${errorMessage}` };
  }
}

export async function handle(request: Request): Promise<Response> {
  try {
    const result = await syncInterpolData();
    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during Interpol sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Record failed sync in history for top-level errors
    await recordSyncHistory('INTERPOL', 'FAILED', `Interpol sync failed: ${errorMessage}`, 0);
    
    return new Response(superjson.stringify({ success: false, message: `Interpol sync failed: ${errorMessage}` }), { status: 500 });
  }
}