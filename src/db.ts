import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./sqlite.db" });
const client = new PrismaClient({ adapter }) as any; // Cast to any for dynamic model access
export { client };

/**
 * Dynamically fetches records from any table that has a fetchRunDetail relation.
 */
export async function getBatchedRecords(tableName: string, count: number = 100) {
  return await client[tableName].findMany({
    where: {
      OR: [
        { fetchRunDetail: { is: null } },
        { fetchRunDetail: { is: { status: "pending" } } }
      ]
    },
    take: count, // Prisma uses 'take', not 'limit'
    include: { fetchRunDetail: true }
  });
}

export async function getRecordById(tableName: string, id: string | number) {
  return await client[tableName].findUnique({
    where: { id },
    include: { fetchRunDetail: true }
  });
}

export async function createProcessAttempt({ fetchRunDetailId, fetchRunId, attemptNumber, result, isSuccess, failureReason }: any) {
  return await client.processAttempt.create({
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

export async function updateStatus(tableName: string, id: string | number, status: string) {
  // Assuming a one-to-one or explicit relation to fetchRunDetail
  const record = await client[tableName].findUnique({ where: { id }, select: { fetchRunDetail: true } });
  if (record?.fetchRunDetail) {
    await client.fetchRunDetail.update({
      where: { id: record.fetchRunDetail.id },
      data: { status }
    });
  }
}

export async function createFetchRun({ runType, llmModelUsed, inputData, status }: any) {
  return await client.fetchRun.create({
    data: { runType, llmModelUsed, inputData, status }
  });
}
