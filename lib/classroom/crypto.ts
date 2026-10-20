import crypto from "node:crypto";
export type ContentEnvelope={format:number;algorithm:string;context:string;keyId:string;iv:string;tag:string;ciphertext:string;plaintextSHA256:string};
export function sealContent(plaintext:Buffer,key:Buffer,context:string){
 if(key.length!==32)throw new Error('A 256-bit private content key is required.');
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(context));
 const encrypted=Buffer.concat([cipher.update(plaintext),cipher.final()]);
 return {format:1,algorithm:'aes-256-gcm',context,keyId:crypto.createHash('sha256').update(key).digest('hex').slice(0,16),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:encrypted.toString('base64'),plaintextSHA256:crypto.createHash('sha256').update(plaintext).digest('hex')};
}
export function openContent(envelope:ContentEnvelope,key:Buffer,expectedContext:string){
 if(key.length!==32||envelope.format!==1||envelope.algorithm!=='aes-256-gcm'||envelope.context!==expectedContext)throw new Error('Invalid encrypted classroom release.');
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));decipher.setAAD(Buffer.from(expectedContext));decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
 const content=Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]);
 if(crypto.createHash('sha256').update(content).digest('hex')!==envelope.plaintextSHA256)throw new Error('Classroom release checksum differs.');
 return content;
}
