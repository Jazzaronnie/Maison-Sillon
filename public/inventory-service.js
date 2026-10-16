/* Database records determine visibility; the saved catalogue supplies cover art. */
(function(root){
  const endpoint=location.protocol==='file:'
    ?'https://maison-sillon.justun978.workers.dev/api/inventory?max=2000':'/api/inventory?max=2000';
  const isSold=r=>['sold','vendu'].includes(String(r.status).toLowerCase())||Number(r.quantity)===0;
  const isAvailable=r=>r.status==='available'&&Number(r.quantity)>0&&!Number(r.is_hidden);
  function mergeInventory(cached,live){
    const stored=new Map(cached.map(r=>[r.listing_key,r]));
    return live.filter(r=>r.listing_key&&!Number(r.is_hidden)&&!/\bcass(?:ette)?\b|8[-\s]?(?:trk|track)/i.test(r.format||'')).map(row=>{
      const previous=stored.get(row.listing_key);
      const details=String(previous?.release_id??'')===String(row.release_id??'')?{}:{catalog_number:null,discogs_country:null};
      return {...previous,...details,...row,cover:row.custom_image_url||previous?.cover||row.discogs_image_url||null};
    });
  }
  async function refresh(cached){
    let next=endpoint,rows=[],offset=0;
    do{
      const response=await fetch(next,{cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('Inventory unavailable');
      const data=await response.json(),page=Array.isArray(data)?data:data.releases;
      if(!Array.isArray(page))throw new Error('Invalid inventory');
      rows.push(...page);
      if(data.hasMore){
        const following=Number(data.nextOffset);
        if(!Number.isInteger(following)||following<=offset||!page.length)throw new Error('Invalid pagination');
        offset=following;next=endpoint+'&offset='+offset;
      }else next=null;
    }while(next);
    return mergeInventory(cached,rows);
  }
  const api={isSold,isAvailable,mergeInventory,refresh};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MaisonInventory=api;
})(globalThis);
