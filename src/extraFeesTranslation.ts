import Sombrero from './Sombrero.js';
import { schemas, models } from './llmModelConfiguration.js';

const escortCleaner = (translation: string) => translation?.replaceAll(/[^\s\p{L}]/ug, " ")?.replaceAll(/\s{2,}/g, " ")?.replaceAll(/re.?up/gi, "")?.trim();
const translationValidator = (oldTranslation: string, newTranslation: string) => {
  if((!oldTranslation && newTranslation) || (oldTranslation && !newTranslation)) return { success: false, reason: "One was blank and the other wasn't"};
  if(!oldTranslation && !newTranslation) return { success: true };
  if(!/^[\p{L}\s]+$/u.test(newTranslation)) return { success: false, reason: "Invalid characters"};
  return { success: true };
};

const prompt = `Translate from Vietnamese to English. Use standard, idiomatic English - not formal, but neither brusque. Use 'you'/'the customer' instead of 'bro/sis'. When the entire text is just 'Không','Không có' or similar, return null. CIA in Vietnamese is CIM in English. Refer to this mapping for other translations of special terms:
Kissing => Hôn môi
Threesome => Some
Cum in mouth (CIM) => Cum in alo (CIA)
Squeeze boobs => Bóp vú
Play with boobs => Bóp vú
Anal licking => Dọn WC
Anal sex => Chơi lỗ nhị
Eat pussy => Vét máng
Overnight => Qua đêm
`;

const options = {
  mode: "gaito",
  tableName: 'escort',
  inputColumn: 'extraFees',
  fetchConfig: { prompt, llmModel: models.arcee, jsonSchema: schemas.default },
  cleaner: escortCleaner,
  validator: translationValidator,
  maxAttempts: 3,
}

const sombreroClient = new Sombrero(options);

await sombreroClient.run({count: 10, max: 50});
