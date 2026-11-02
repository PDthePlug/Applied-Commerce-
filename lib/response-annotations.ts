export const confidenceSlot='annotation-confidence';
export const confidenceMeaning:Record<string,string>={believe:'⭐ — A statement I genuinely believe',unsure:'❓ — A statement I am unsure about'};
export function displayLearnerResponse(key:string,value:string){return key.endsWith('::'+confidenceSlot)?confidenceMeaning[value]??value:value;}
