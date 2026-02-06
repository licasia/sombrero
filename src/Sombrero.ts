import * as db from './db.js';
import { Fetcher, FetchConfig } from './Fetcher.js';

interface SombreroOptions {
  tableName: string;
  inputColumn: string;
  fetchConfig: FetchConfig;
  cleaner: (input: any) => string;
  validator: (oldVal: any, newVal: any) => { success: boolean; reason?: string };
  maxAttempts: number;
}

export default class Sombrero {
  constructor(private options: SombreroOptions) {}

  async run({max, count}: {max: number, count: number}) {
    while(true) {
      const processedCount = await this.runBatch(count);
      if(processedCount === 0 || processedCount >= max) return;
    }
  }

  async runBatch(count: number = 10) {
    const records = await db.getBatchedRecords(this.options.tableName, count);
    if (records.length === 0) return 0;

    const fetcher = new Fetcher(this.options.fetchConfig);

    // 1. Create a Fetch Run for auditing
    const fetchRun = await db.createFetchRun({
      runType: this.options.tableName,
      modelUsed: this.options.fetchConfig.llmModel,
      inputData: JSON.stringify(records.map((r: any) => r[this.options.inputColumn])),
      status: "processing"
    });

    for (const record of records) {
      const rawInput = record[this.options.inputColumn];
      const cleanedInput = this.options.cleaner(rawInput);
      
      try {
        const llmResult = await fetcher.fetchResults(cleanedInput);
        const validation = this.options.validator(rawInput, llmResult);

        const currentAttempt = record.fetchRunDetails?.processAttempts?.length || 0;

        await db.createProcessAttempt({
          fetchRunDetailsId: record.fetchRunDetails.id,
          fetchRunId: fetchRun.id,
          attemptNumber: currentAttempt + 1,
          result: llmResult,
          isSuccess: validation.success,
          failureReason: validation.reason
        });

        // Determine final status
        let newStatus = "pending";
        if (validation.success) newStatus = "success";
        else if (currentAttempt + 1 >= (this.options.maxAttempts || 3)) newStatus = "error";

        await db.updateStatus(this.options.tableName, record.id, newStatus);

        console.log(`Successfully processed ${records.length} records...`);
        
      } catch (error: any) {
        console.error(`Error processing record ${record.id}:`, error.message);
      }
    }

    return records.length;
  }
}
