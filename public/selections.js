/* Catalogue selection is independent of GSAP and of the DOM. */
(function(root){
  function getRandomSelections(catalog,count=3,random=Math.random){
    const pool=catalog.filter(album=>album.status==='available'&&Number(album.quantity)>0);
    const unique=[...new Map(pool.map(album=>[album.listing_key,album])).values()];
    const requested=Math.max(0,Math.min(unique.length,Math.floor(Number(count)||0)));
    // Partial Fisher–Yates: uniform sampling without replacement.
    for(let i=0;i<requested;i++){
      const j=i+Math.floor(Math.min(.999999999999,Math.max(0,random()))*(unique.length-i));
      [unique[i],unique[j]]=[unique[j],unique[i]];
    }
    return unique.slice(0,requested);
  }
  const api={getRandomSelections};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MaisonSelection=api;
})(globalThis);
