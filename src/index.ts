import Sombrero from './Sombrero.js';
import { schemas, models } from './llmModelConfiguration.js';

const escortCleaner = (name: string) => name?.replace(/\W+/, "")?.replace(/\s{2,}/, " ")?.replace(/re.up/i, "")?.trim();
const nameValidator = (oldName: string, newName: string) => {
  if((!oldName && newName) || (oldName && !newName)) return { success: false, reason: "One was blank and the other wasn't"};
  if(!oldName && !newName) return { success: true };
  if(oldName && !oldName.toLowerCase().includes(newName.toLowerCase())) return { success: false, reason: "New name not in included in old name" };
  if(/re.up/i.test(newName.toLowerCase())) return { success: false, reason: "Reup not part of name" };
  if(/\W/.test(newName)) return { success: false, reason: "Invalid characters"};
  return { success: true };
};

const prompt = "Extract real name for each record (or nickname if no real name exists). Only return JSON";
const sombreroClient = new Sombrero({
  tableName: 'escort',
  inputColumn: 'name',
  fetchConfig: { prompt, llmModel: models.deepseekChimera, jsonSchema: schemas.default },
  cleaner: escortCleaner,
  validator: nameValidator,
  maxAttempts: 3,
});

await sombreroClient.runBatch(50);
