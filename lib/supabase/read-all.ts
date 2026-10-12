// Supabase caps result sets. Always use a stable order on queries passed here.
export async function readAllRows<T>(query:{range(from:number,to:number):PromiseLike<{data:T[]|null;error:unknown}>}){
  const rows:T[]=[];
  const pageSize=500;
  for(let offset=0;;offset+=pageSize){
    const result=await query.range(offset,offset+pageSize-1);
    if(result.error)throw result.error;
    const page=result.data??[];
    rows.push(...page);
    if(page.length<pageSize)return {data:rows,error:null};
  }
}
