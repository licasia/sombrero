import { Db } from './Db.js';
import { Fetcher, FetchConfig } from './Fetcher.js';

interface SombreroOptions {
  mode: string;
  tableName: string;
  inputColumn: string;
  fetchConfig: FetchConfig;
  cleaner: (input: any) => string;
  validator: (oldVal: any, newVal: any) => { success: boolean; reason?: string };
  maxAttempts: number;
}

export default class Sombrero {
  db: any;

  constructor(private options: SombreroOptions) {
    this.db = new Db(this.options.mode);
  }

  async run({max, count}: {max: number, count: number}) {
    let total = 0;
    while(true) {
      const processedCount = await this.runBatch(count);
      if(processedCount === 0 || total >= max) return;
      total += processedCount;
      await new Promise(r => setTimeout(() => r(null), 3000));
    }
  }

  async runBatch(count: number = 10) {
    const records = await this.db.getBatchedRecords(this.options.tableName, this.options.inputColumn, count);
    if (records.length === 0) return 0;

    const fetcher = new Fetcher(this.options.fetchConfig);

    const fetchRun = await this.db.createFetchRun({
      runType: this.options.tableName,
      modelUsed: this.options.fetchConfig.llmModel,
      inputData: JSON.stringify(records.map((r: any) => ({id: r.id, input: r[this.options.inputColumn]}))),
      status: "processing"
    });

    const inputRecords = records.map((r: any) => ({
      id: r.id,
      input: this.options.cleaner ? this.options.cleaner(r[this.options.inputColumn]) : r[this.options.inputColumn]
    }));
      
    console.log(`Processing [${inputRecords.length}] records (ex: ${inputRecords.slice(0, 3).map((r: any) => r.input).join(", ")})`);
    //try {
      const llmResults = await fetcher.fetchResults(JSON.stringify(inputRecords));
      this.db.updateFetchRunRawResult({id: fetchRun.id, rawResult: llmResults});
      const results = JSON.parse(llmResults);


      for(const result of results) {
        const record = records.find((r: any) => r.id === result.id);
        if(!record) {
          console.warn(`Record with id[${result.id} not found`);
          continue;
        }
        console.log(`Processing result id[${result.id}] input[${record[this.options.inputColumn]} output[${result.output}]`);

        const validation = this.options.validator(
          record?.[this.options.inputColumn],
          result.output);

        const currentAttempt = record.fetchRunDetail?.processAttempts?.length || 0;
        let newStatus = "pending";
        if (validation.success) newStatus = "success";
        else if (currentAttempt + 1 >= (this.options.maxAttempts || 3)) newStatus = "error";

        const fetchRunDetail = await this.db.updateFetchRunDetail(
          { escortId: record.id,
            status: newStatus,
            result: validation.success ? result.output : undefined });

        await this.db.createProcessAttempt({
          fetchRunDetailId: fetchRunDetail.id,
          fetchRunId: fetchRun.id,
          attemptNumber: currentAttempt + 1,
          result: result.output,
          isSuccess: validation.success,
          failureReason: validation.reason
        });

        
      //} catch (error: any) {
       // console.error(`Error processing record ${record.id}:`, error.message);
      //}
    }
    console.log(`Successfully processed ${records.length} records...`);

    return records.length;
  }
}
