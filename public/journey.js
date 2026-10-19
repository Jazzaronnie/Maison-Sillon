/* Scroll architecture only. Album selection and catalogue rendering live elsewhere. */
(function(){
  const q=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);
  const clamp=(x)=>Math.max(0,Math.min(1,x));
  const state={zoom:0,flip:0,cards:0};
  let openingY=null,introComplete=false,handoffPending=false,touching=false,settleTimer=0;
  let layoutWidth=innerWidth,layoutHeight=innerHeight;
  let timeline=null,ready=false,mediaQuery=matchMedia('(prefers-reduced-motion: reduce)');
  function render(){
    if(!ready||introComplete||document.body.classList.contains('journey-static'))return;
    const w=innerWidth,mobile=w<=650,h=w<=1024?layoutHeight:innerHeight;
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
    position.style.transform=`translate(-50%,-50%)`;
    const jewel=q('.jewel');jewel.classList.toggle('settled',state.flip>=.9999);
    jewel.style.transform=`rotateY(${state.flip*180}deg) rotateZ(${(1-state.zoom)*-7}deg)`;
    q('.intro').style.opacity=1-clamp(state.zoom*2);
    q('.journey-footer').style.opacity=1-clamp(state.zoom*2);
    q('.journey-footer').setAttribute('aria-hidden',String(state.zoom>=.5));
    q('.intro').style.transform=`translateY(${-state.zoom*40}px)`;
    q('.wall').style.opacity=1-clamp(state.zoom*1.6);
    q('.wall').style.transform=`rotate(${-9+state.zoom*9}deg) scale(${1+state.zoom*.2})`;
    const backInteractive=state.flip>=.9999;
    all('.album-mini-card').forEach((card,i)=>{
      const t=clamp(state.cards*1.6-i*.3);
      card.inert=!backInteractive||t<.99;card.style.opacity=t;
      card.style.transform=`translateY(${(1-t)*16}px)`;
    });
    // Only the introduction is animated. The catalogue stays in normal document
    // flow, so focus, filtering and keyboard dismissal cannot rewind the case.
    q('.stage').dataset.phase=state.flip>=.9999?'selections':state.flip>.001?'flip':'grid';
    q('.back').inert=state.flip<.9999;
    q('.front').inert=state.flip>.001;
    q('.progress i').style.width=`${(timeline?.progress()||0)*100}%`;
  }
  function staticMode(){
    document.documentElement.classList.remove('intro-running');
    document.body.classList.remove('motion-enabled');document.body.classList.add('journey-static');
    for(const selector of ['#journey','#catalogue','.stage','.case-position','.jewel','.intro','.wall'])q(selector).style.cssText='';q('.jewel').classList.add('settled');q('#catalogue').inert=false;
    all('.album-mini-card').forEach(c=>{c.inert=false;c.style.opacity=1;c.style.transform='none'});
    q('.back').inert=false;q('.front').inert=true;
  }
  function setup(){
    if(introComplete)return;
    const firstSetup=!ready;
    // A phone keyboard or collapsing address bar must not resize the scroll runway.
    // A real width change (including rotation) still recalculates the composition.
    if(firstSetup||innerWidth!==layoutWidth||innerWidth>1024)layoutHeight=innerHeight;
    layoutWidth=innerWidth;
    if(firstSetup&&location.hash!=='#catalogue')window.scrollTo({top:0,left:0,behavior:'instant'});
    if(timeline){timeline.scrollTrigger?.kill();timeline.kill();timeline=null}
    ready=true;
    if(mediaQuery.matches||!window.gsap||!window.ScrollTrigger){staticMode();return}
    document.documentElement.classList.add('intro-running');
    document.body.classList.remove('journey-static');document.body.classList.add('motion-enabled');
    gsap.registerPlugin(ScrollTrigger);
    if(innerWidth<=1024){
      q('#journey').style.height=`${layoutHeight*4.4}px`;
      q('.stage').style.height=`${layoutHeight}px`;
    }else{
      q('#journey').style.removeProperty('height');q('.stage').style.removeProperty('height');
    }
    q('#catalogue').style.cssText='';q('#catalogue').inert=false;
    openingY=null;
    q('.wall').style.top='';
    Object.assign(state,{zoom:0,flip:0,cards:0});
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
    // Give the selections a brief reading pause, then let the whole finished
    // stage leave naturally as the separate catalogue enters from below.
    timeline.to(state,{cards:1,duration:1.6},'selections');
    // Build all tweens before attaching ScrollTrigger. Fixed from-values prevent
    // a rebuild at mid-scroll from capturing that frame as the new start state.
    ScrollTrigger.create({id:'maison-sillon-journey',animation:timeline,
      trigger:'#journey',start:'top top',end:()=>q('#journey').offsetTop+q('#journey').offsetHeight-(innerWidth<=1024?layoutHeight:innerHeight),scrub:.22,
      onRefresh:self=>{timeline.progress(self.progress);render()},
      onLeave:render,onEnterBack:render});
    ScrollTrigger.refresh();synchronize();
    requestAnimationFrame(completeIntroIfReached);
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
  function finishIntro(){
    if(!handoffPending||introComplete||touching)return;
    clearTimeout(settleTimer);handoffPending=false;
    const catalogue=q('#catalogue'),before=catalogue.getBoundingClientRect().top;
    const phoneLanding=innerWidth<=650;
    introComplete=true;
    timeline.scrollTrigger?.kill();timeline.pause();
    document.documentElement.classList.remove('intro-running');
    document.body.classList.add('intro-complete');
    q('.stage').dataset.phase='complete';
    // Change document height only AFTER the native scroll has stopped. Repeated
    // scrollTo calls during Android/WebView momentum cause visible flashing.
    window.scrollTo({top:phoneLanding?0:Math.max(0,catalogue.offsetTop-before),left:scrollX,behavior:'instant'});
  }
  function scheduleHandoff(){
    clearTimeout(settleTimer);
    if(handoffPending&&!touching)settleTimer=setTimeout(finishIntro,220);
  }
  function completeIntroIfReached(){
    if(introComplete||!timeline||document.body.classList.contains('journey-static'))return;
    const reached=innerWidth<=650?scrollY>=timeline.scrollTrigger.end:q('#catalogue').getBoundingClientRect().top<=0;
    if(reached)handoffPending=true;
    else handoffPending=false;
    scheduleHandoff();
  }
  // Native scroll snapping catches Face B. Wait for finger release AND the end
  // of momentum before removing the completed intro. Older browsers use quiet
  // scroll events as a fallback; there is no counter-scroll loop or input lock.
  document.addEventListener('touchstart',()=>{touching=true;clearTimeout(settleTimer)},{passive:true});
  const endTouch=event=>{touching=event.touches.length>0;scheduleHandoff()};
  document.addEventListener('touchend',endTouch,{passive:true});
  document.addEventListener('touchcancel',endTouch,{passive:true});
  document.addEventListener('scrollend',()=>{if(handoffPending&&!touching)finishIntro()},{passive:true});
  let completionFrame=0;
  addEventListener('scroll',()=>{
    if(introComplete)return;
    clearTimeout(settleTimer);
    if(completionFrame)return;
    completionFrame=requestAnimationFrame(()=>{completionFrame=0;completeIntroIfReached()});
  },{passive:true});
  function restartIntro(event){
    event.preventDefault();
    if(completionFrame){cancelAnimationFrame(completionFrame);completionFrame=0}
    introComplete=false;handoffPending=false;clearTimeout(settleTimer);
    document.body.classList.remove('intro-complete');
    history.replaceState(history.state,'',location.pathname+location.search);
    window.scrollTo({top:0,left:0,behavior:'instant'});
    setup();synchronize();
  }
  all('a.brand[href="#"]').forEach(link=>link.addEventListener('click',restartIntro));
  q('#search').addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.isComposing)return;
    event.preventDefault();
    // Search results already update as the visitor types. The keyboard's Search
    // action should dismiss it, without navigating or clearing the query.
    event.currentTarget.blur();
  });
  let resizeTimer;addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    if(innerWidth<=1024&&innerWidth===layoutWidth)return;
    resizeTimer=setTimeout(()=>{if(ready)setup()},120);
  });
  mediaQuery.addEventListener('change',setup);
  window.MaisonJourney={setup,redraw:render,goToCatalogue};
})();
