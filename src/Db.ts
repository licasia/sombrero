import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.js";

export class Db {
  private client: any;

  constructor(mode: string) {
    const adapter = new PrismaBetterSqlite3({ url: process.env[`${mode.toUpperCase()}_URL`] || "file:./sqlite.db" });
    this.client = new PrismaClient({ adapter }) as any; // Cast to any for dynamic model access
  }

  async getBatchedRecords(tableName: string, column: string, count: number = 100) {
    return await this.client[tableName].findMany({
      where: {
        AND: [
          {
            OR: [
              { fetchRunDetail: { is: null } },
              { fetchRunDetail: { is: { status: "pending" } } }
            ],
          },
          { [column]: { not: null }},
          { [column]: { not: "" }}
        ]
      },
      take: count, 
      include: { fetchRunDetail: { include: { processAttempts: true } } }
    });
  }

  async getRecordById(tableName: string, id: string | number) {
    return await this.client[tableName].findUnique({
      where: { id },
      include: { fetchRunDetail: true }
    });
  }

  async createProcessAttempt({ fetchRunDetailId, fetchRunId, attemptNumber, result, isSuccess, failureReason }: any) {
    return await this.client.processAttempt.create({
      data: {
        fetchRunDetail: { connect: { id: fetchRunDetailId } },
        fetchRun: { connect: { id: fetchRunId } },
        attemptNumber,
        result,
        isSuccess,
        failureReason
      }
    });
  }

  async updateFetchRunRawResult({id, rawResult}: {id: number, rawResult: string}) {
    await this.client.fetchRun.update({
      where: { id },
      data: { rawResult }
    });
  }

  async updateFetchRunDetail({escortId, status, result}: {escortId: number, status: string, result: string}) {
    const record = await this.client.fetchRunDetail.upsert({
      where: { escortId },
      update: { status, result },
      create: { status, result, escortId }
    });
    return record;
  }

  async createFetchRun({ runType, llmModelUsed, inputData, status }: any) {
    return await this.client.fetchRun.create({
      data: { runType, llmModelUsed, inputData, status }
    });
  }

  async apply({tableName, columnName, defaultValue}: any) {
    const fetchRunDetails = await this.client.fetchRunDetail.findMany({
      where: {
        AND: [
          {status: "success"},
          {result: { not: null }}
        ]
      }});

    for(const detail of fetchRunDetails) {
      const modelId = detail[`${tableName}Id`];
      const model = await this.client[tableName].findUnique({ where: { id: modelId }});
      if(!model) {
        console.warn(`FetchRunDetail has non-existent FK ID: ${modelId}`);
        continue;
      }
      await this.client[tableName].update({
        where: { id: modelId },
        data: { [columnName]: detail.result }
      });

    }

    if(defaultValue) {
      await this.client[tableName].updateMany({
        //where: { notIn: { id: fetchRunDetails.map((d: any) => d[`${tableName}Id`]) } },
        where: { [columnName]: null },
        data: { [columnName]: defaultValue }
      });
    }
  }
}
