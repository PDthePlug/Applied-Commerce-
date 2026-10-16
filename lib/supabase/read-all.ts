type RowsQuery<T> = {range(from:number,to:number):PromiseLike<{data:T[]|null;error:unknown}>};

// Supabase caps result sets. Always use a stable order on queries passed here.
export async function readAllRows<T>(query:RowsQuery<T>){
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

// Bound the request URL as well as the number of rows returned by each request.
// Each factory must apply its ownership/release filters and a stable row order.
export async function readRowsByIds<T>(ids:readonly string[],query:(batch:string[])=>RowsQuery<T>){
  const unique=[...new Set(ids)];
  const rows:T[]=[];
  for(let offset=0;offset<unique.length;offset+=100){
    const result=await readAllRows(query(unique.slice(offset,offset+100)));
    rows.push(...result.data);
  }
  return {data:rows,error:null};
}
