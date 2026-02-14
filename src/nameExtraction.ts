import Sombrero from './Sombrero.js';
import { Db } from './Db.js';
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

const prompt = "Extract real name or nickname with proper capitalizaiton for each record. Strip html tags like <b> or <span> as well es emoticons and any other characters that are not part of names. If no name or nickname appears, use undefined. Only return JSON";

const options = {
  tableName: 'escort',
  inputColumn: 'name',
  fetchConfig: { prompt, llmModel: models.arcee, jsonSchema: schemas.default },
  cleaner: escortCleaner,
  validator: nameValidator,
  maxAttempts: 3,
}

const modes = ["gaigu", "gaito", "cvt"] as const;

/*for (const m of modes) {
  const opts = { ...options, mode: m };
  
  const sombreroClient = new Sombrero(opts);
  await sombreroClient.run({ count: 50, max: 5000 });
}*/

for (const m of modes) {
  const db = new Db(m);
  db.apply({tableName: "escort", columnName: "name", defaultValue: "A Cute Girl"});
}
