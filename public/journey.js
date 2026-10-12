/* Scroll architecture only. Album selection and catalogue rendering live elsewhere. */
(function(){
  const q=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);
  const clamp=(x)=>Math.max(0,Math.min(1,x));
  const state={zoom:0,flip:0,cards:0,plunge:0,scale:1,blend:0,sceneFade:0};
  let openingY=null;
  let timeline=null,ready=false,mediaQuery=matchMedia('(prefers-reduced-motion: reduce)');
  function render(){
    if(!ready||document.body.classList.contains('journey-static'))return;
    const w=innerWidth,h=innerHeight,mobile=w<=650;
    const base=mobile?w*.41:Math.min(w*.41,h*.34,340);
    const zoomed=mobile?Math.min(w*.90,h*.53):Math.min(w*.58,h*.78,Math.max(240,h-146));
    const size=base+(zoomed-base)*state.zoom;
    const initialX=w*.5,initialY=mobile?h*.69:(openingY??h*.69);
    const zoomX=w*.5,zoomY=mobile?h*.48:(h+82)/2;
    const x=initialX+(zoomX-initialX)*state.zoom;
    const y=initialY+(zoomY-initialY)*state.zoom;
    const position=q('.case-position');
    position.style.width=`${Math.round(size)}px`;
    position.style.left=`${x}px`;position.style.top=`${y}px`;
    position.style.transform=`translate(-50%,-50%) scale(${state.scale})`;
    position.dataset.diveScale=state.scale.toFixed(2);
    const jewel=q('.jewel');jewel.classList.toggle('settled',state.flip>=.9999);
    jewel.style.transform=`rotateY(${state.flip*180}deg) rotateZ(${(1-state.zoom)*-7}deg)`;
    q('.intro').style.opacity=1-clamp(state.zoom*2);
    q('.journey-footer').style.opacity=1-clamp(state.zoom*2);
    q('.journey-footer').setAttribute('aria-hidden',String(state.zoom>=.5));
    q('.intro').style.transform=`translateY(${-state.zoom*40}px)`;
    q('.wall').style.opacity=1-clamp(state.zoom*1.6);
    q('.wall').style.transform=`rotate(${-9+state.zoom*9}deg) scale(${1+state.zoom*.2})`;
    const backInteractive=state.flip>=.9999&&state.plunge<=.001;
    all('.album-mini-card').forEach((card,i)=>{
      const t=clamp(state.cards*1.6-i*.3);
      card.inert=!backInteractive||t<.99;card.style.opacity=t;
      card.style.transform=`translateY(${(1-t)*16}px)`;
    });
    const scene=q('.stage'),catalogue=q('#catalogue');
    scene.style.opacity=1-state.sceneFade;
    q('.back').inert=state.flip<.9999||state.plunge>.001;
    q('.front').inert=state.flip>.001;
    scene.dataset.phase=state.blend>.99?'catalogue':state.plunge>.001?'dive':state.flip>.99?'selections':state.flip>.001?'flip':'grid';
    catalogue.style.opacity=state.blend;
    const end=q('#catalogue').offsetTop;
    // The real catalogue occupies the last viewport of the runway. Compensation
    // holds it in the same visual position during the dissolve and is zero at
    // handoff: no clone, no reparenting, no jump to a second copy of the UI.
    catalogue.style.transform=`translateY(${-Math.max(0,end-scrollY)}px)`;
    catalogue.inert=state.blend<.999;
    catalogue.style.pointerEvents=catalogue.inert?'none':'auto';
    catalogue.style.willChange=state.blend===1?'auto':'transform,opacity';
    q('.progress i').style.width=`${(timeline?.progress()||0)*100}%`;
  }
  function staticMode(){
    document.body.classList.remove('motion-enabled');document.body.classList.add('journey-static');
    for(const selector of ['#catalogue','.stage','.case-position','.jewel','.intro','.wall'])q(selector).style.cssText='';q('.jewel').classList.add('settled');q('#catalogue').inert=false;
    all('.album-mini-card').forEach(c=>{c.inert=false;c.style.opacity=1;c.style.transform='none'});
    q('.back').inert=false;q('.front').inert=true;
  }
  function setup(){
    const firstSetup=!ready;
    if(firstSetup&&location.hash!=='#catalogue')window.scrollTo({top:0,left:0,behavior:'instant'});
    if(timeline){timeline.scrollTrigger?.kill();timeline.kill();timeline=null}
    ready=true;
    if(mediaQuery.matches||!window.gsap||!window.ScrollTrigger){staticMode();return}
    document.body.classList.remove('journey-static');document.body.classList.add('motion-enabled');
    gsap.registerPlugin(ScrollTrigger);
    openingY=null;
    q('.wall').style.top='';
    Object.assign(state,{zoom:0,flip:0,cards:0,plunge:0,scale:1,blend:0,sceneFade:0});
    // Position desktop artwork from the actual translated text height, rather
    // than a viewport percentage. Phone positioning stays unchanged.
    render();
    if(innerWidth>650){
      const sceneTop=q('.stage').getBoundingClientRect().top;
      const copyBottom=q('.intro-copy').getBoundingClientRect().bottom-sceneTop;
      const firstCover=[...all('.wall-cover')].find(c=>c.getBoundingClientRect().left>=0)||q('.wall-cover');
      if(firstCover){
        const currentTop=parseFloat(getComputedStyle(q('.wall')).top);
        const firstTop=firstCover.getBoundingClientRect().top-sceneTop;
        q('.wall').style.top=`${currentTop+copyBottom+48-firstTop}px`;
      }
      const base=Math.min(innerWidth*.41,innerHeight*.34,340);
      openingY=copyBottom+48+base/2;
      render();
    }
    timeline=gsap.timeline({
      defaults:{ease:'none'},paused:true,onUpdate:render
    });
    // Grid zoom -> 3D flip reveals selections directly on the case back.
    timeline.addLabel('grid',0)
      .fromTo(state,{zoom:0},{zoom:1,duration:2,ease:'power1.inOut'},0)
      .addLabel('flip',2.2).fromTo(state,{flip:0},{flip:1,duration:1.35,ease:'power1.inOut'},'flip')
      .fromTo(state,{cards:0},{cards:1,duration:.9,ease:'power1.out'},3.5)
      .addLabel('selections',4.4);
    // Hold the selection before the short, accelerated immersive plunge.
    timeline.addLabel('dive',5.6)
      .fromTo(state,{plunge:0,scale:1},{plunge:1,scale:6,duration:.8,ease:'power3.in'},'dive')
      .fromTo(state,{blend:0},{blend:1,duration:.55,ease:'power1.inOut'},5.98)
      .fromTo(state,{sceneFade:0},{sceneFade:1,duration:.48,ease:'power1.inOut'},6.05)
      .addLabel('catalogue',6.53);
    // Build all tweens before attaching ScrollTrigger. Fixed from-values prevent
    // a rebuild at mid-scroll from capturing that frame as the new start state.
    ScrollTrigger.create({id:'maison-sillon-journey',animation:timeline,
      trigger:'#journey',start:'top top',end:'bottom bottom',scrub:.22,
      onRefresh:self=>{timeline.progress(self.progress);render()},
      onLeave:render,onEnterBack:render});
    ScrollTrigger.refresh();synchronize();
  }
  function synchronize(){
    if(!timeline?.scrollTrigger)return;
    timeline.scrollTrigger.update();
    timeline.scrollTrigger.getTween()?.progress(1);
    timeline.progress(timeline.scrollTrigger.progress);
    render();
  }
  // Recheck after image/font layout and when returning from browser page cache.
  addEventListener('load',()=>{if(ready){window.ScrollTrigger?.refresh();synchronize()}});
  addEventListener('pageshow',()=>requestAnimationFrame(()=>{if(ready){window.ScrollTrigger?.refresh();synchronize()}}));
  document.fonts?.ready.then(()=>{if(ready){window.ScrollTrigger?.refresh();synchronize()}});
  function goToCatalogue(){
    const target=q('#catalogue').offsetTop;
    window.scrollTo({top:target??q('#catalogue').offsetTop,behavior:mediaQuery.matches?'instant':'smooth'});
  }
  let resizeTimer;addEventListener('resize',()=>{render();clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(ready)setup()},120)});
  mediaQuery.addEventListener('change',setup);
  window.MaisonJourney={setup,redraw:render,goToCatalogue};
})();
