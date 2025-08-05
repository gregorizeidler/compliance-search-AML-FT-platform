import { schema, OutputType } from "./all_POST.schema";
import superjson from 'superjson';
import { handle as handleOfac } from "./ofac_POST";
import { handle as handleEu } from "./eu_POST";
import { handle as handleUn } from "./un_POST";
import { handle as handleInterpol } from "./interpol_POST";
import { db } from "../../helpers/db";

export async function handle(request: Request): Promise<Response> {
  console.log("Starting all data synchronization...");

  try {
    // In a serverless environment, we can't truly run these in the background.
    // We trigger them and report the outcome of the trigger.
    // The actual sync logic in each endpoint is placeholder, so this will reflect that.
    
    // Create mock requests for each endpoint since they don't expect any body
    const mockRequest = new Request('http://localhost/', { method: 'POST' });
    
    const results = await Promise.allSettled([
      handleOfac(mockRequest),
      handleEu(mockRequest),
      handleUn(mockRequest),
      handleInterpol(mockRequest),
    ]);

    // Parse all responses to extract summary information and records affected
    const responseData = await Promise.all(results.map(async (result, index) => {
      const source = ["OFAC", "EU", "UN", "Interpol"][index];
      if (result.status === 'fulfilled') {
        try {
          const responseText = await result.value.text();
          const parsedResult = superjson.parse(responseText);
          
          // Type guard for error response
          if (typeof parsedResult === 'object' && parsedResult !== null && 'error' in parsedResult) {
            return {
              source,
              success: false,
              summary: `${source}: Error - ${String(parsedResult.error)}`,
              recordsAffected: 0
            };
          }
          
          // Type guard for success response
          if (typeof parsedResult === 'object' && parsedResult !== null && 'message' in parsedResult) {
            const recordsAffected = (typeof parsedResult === 'object' && 'records_affected' in parsedResult && typeof parsedResult.records_affected === 'number') 
              ? parsedResult.records_affected 
              : 0;
            const isSuccess = 'success' in parsedResult && typeof parsedResult.success === 'boolean' && parsedResult.success;
            
            return {
              source,
              success: isSuccess,
              summary: `${source}: ${String(parsedResult.message)}`,
              recordsAffected
            };
          }
          
          return {
            source,
            success: false,
            summary: `${source}: Unexpected response format`,
            recordsAffected: 0
          };
        } catch (error) {
          return {
            source,
            success: false,
            summary: `${source}: Failed to parse response`,
            recordsAffected: 0
          };
        }
      } else {
        const errorMessage = result.reason instanceof Error ? result.reason.message : "Unknown error";
        return {
          source,
          success: false,
          summary: `${source}: Failed to trigger sync. Reason: ${errorMessage}`,
          recordsAffected: 0
        };
      }
    }));

    const summary = responseData.map(data => data.summary);
    const overallSuccess = responseData.every(data => data.success);
    const totalRecordsAffected = responseData.reduce((sum, data) => sum + data.recordsAffected, 0);

    // Register sync history
    try {
      await db.insertInto('syncHistory').values({
        source: 'ALL',
        status: overallSuccess ? 'SUCCESS' : 'FAILED',
        message: summary.join('; '),
        recordsAffected: totalRecordsAffected
      }).execute();
    } catch (error) {
      console.error("Failed to register sync history:", error);
      // Continue execution - don't fail the entire sync just because history recording failed
    }

    const output: OutputType = {
      success: overallSuccess,
      message: "All sync processes triggered. See details for status.",
      details: summary,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error during 'all' sync:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}