import type {ContentBlock} from './types';
export type SourceSelection={slot:string;options:string[];reasoning?:boolean};
// Reviewed circling tasks: selections use authored labels or the learner's own
// earlier answers, and preserve the written explanation as a separate response.
export function sourceSelection(unitId:string,blocks:ContentBlock[],index:number,responses:Record<string,string>):SourceSelection|null{
 const b=blocks[index];if(b?.kind!=='text')return null;
 const key=`${unitId}::${b.id}`;
 const textAt=(id:string,slot:string)=>{const i=blocks.findIndex(block=>block.id===id);return responses[`${unitId}::block-${i}::${slot}`]?.trim()??'';};
 if(key==='g8-t1-l01-001::d1ac8f7f739f0c3d2e659be6-1')return {slot:'annotation-selection',options:[textAt('ebd11d91a554185d98afc1cd-1','blank-0'),textAt('b877b2de9341d638d6529e76-1','blank-0')].filter(Boolean)};
 if(key==='g8-t1-l05-005::e1a0b45e4a61787c670351aa-1')return {slot:'annotation-selection',options:['e8b72a85aa30bffc47048bb3-1','4b11103c49a0460b8de61b65-1','b0345ad0b9ff29c763e79441-1','e8b72a85aa30bffc47048bb3-2','4b11103c49a0460b8de61b65-2','b0345ad0b9ff29c763e79441-2'].map(id=>textAt(id,'numbered')).filter(Boolean),reasoning:true};
 if(key==='g8-t1-l09-009::6332ceb3b7980a1a0eacdad1-1')return {slot:'blank-0',options:['ac0834ddf638248dcf417d51-1','050e84efbe80d093105933bd-1','adf088ebbc3b77228feb852b-1','4f49f0f46cef5ed03072cb77-1','7a54f0e723f870779d6813b7-1','599abdbdc575b6f48af4a5de-1','d157a72910bf3b55313cfa8c-1','b3ba3d40d4cf8b225c73e152-1'].map(id=>textAt(id,'numbered')).filter(Boolean)};
 if(['g11-t2-l22-022::c9a8a325b9ad65d0fdcc294d-1','g11-t2-l24-024::ad2d8bbeda1d311182648f04-1'].includes(key)){
  const table=blocks.find(block=>block.id===(unitId==='g11-t2-l22-022'?'66fbb84d99d088cd023d9676-1':'87973915af5517a81dc9122d-1'));if(table?.kind==='table')return {slot:'blank-0',options:table.rows.slice(1).map(row=>row[0]).filter(Boolean)};
 }
 return null;
}
