import Sombrero from './Sombrero.js';
import { schemas, models } from './llmModelConfiguration.js';

const escortCleaner = (name: string) => name?.replaceAll(/[^\s\p{L}]/ug, " ")?.replaceAll(/\s{2,}/g, " ")?.replaceAll(/re.?up/gi, "")?.trim();
const nameValidator = (oldName: string, newName: string) => {
  if((!oldName && newName) || (oldName && !newName)) return { success: false, reason: "One was blank and the other wasn't"};
  if(!oldName && !newName) return { success: true };
  //if(oldName && !escortCleaner(oldName).toLowerCase().includes(newName.toLowerCase())) return { success: false, reason: "New name not in included in old name" };
  if(/re.up/i.test(newName.toLowerCase())) return { success: false, reason: "Reup not part of name" };
  if(!/^[\p{L}\s]+$/u.test(newName)) return { success: false, reason: "Invalid characters"};
  return { success: true };
};

const prompt = "Extract real name or nickname with proper capitalizaiton for each record. If no name or nickname appears, use null. Only return JSON";

const options = {
  mode: "gaito",
  tableName: 'escort',
  inputColumn: 'name',
  fetchConfig: { prompt, llmModel: models.arcee, jsonSchema: schemas.default },
  cleaner: escortCleaner,
  validator: nameValidator,
  maxAttempts: 3,
}

const sombreroClient = new Sombrero(options);

await sombreroClient.run({count: 10, max: 50});
