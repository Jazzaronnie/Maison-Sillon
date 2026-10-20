/* Scroll architecture only. Album selection and catalogue rendering live elsewhere. */
(function(){
  const q=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);
  const clamp=(x)=>Math.max(0,Math.min(1,x));
  const state={zoom:0,flip:0,cards:0};
  let openingY=null,introComplete=false,handoffPending=false,touching=false,settleTimer=0;
  let layoutWidth=innerWidth,layoutHeight=innerHeight;
  let timeline=null,ready=false,mediaQuery=matchMedia('(prefers-reduced-motion: reduce)');
  // Each separate input gesture advances exactly one animated chapter.
  let gates=[],gateBypassUntil=0;
  let chapter=0,chapterTween=null,lastWheelAt=-Infinity,touchStartY=0,touchConsumed=false;
  function controlsIntro(){
    return ready&&timeline?.scrollTrigger&&Number.isFinite(timeline.scrollTrigger.end)&&!introComplete&&(chapter<3||chapterTween)&&!mediaQuery.matches&&!document.body.classList.contains('journey-static')&&performance.now()>=gateBypassUntil&&!document.querySelector('dialog[open]');
  }
  function advanceChapter(direction){
    if(!controlsIntro()||chapterTween)return;
    const next=Math.max(0,Math.min(3,chapter+direction));
    if(next===chapter)return;
    chapter=next;
    const trigger=timeline.scrollTrigger;
    // The catalogue has its own padding/layout offset after the runway; using
    // trigger.end alone leaves the visitor on the back cover indefinitely.
    const target=chapter===0?trigger.start:chapter===3?q('#catalogue').offsetTop:gateScrollPosition(chapter-1);
    const position={y:scrollY};
    chapterTween=gsap.to(position,{y:target,duration:chapter===3?1:1.25,ease:'power2.inOut',onUpdate:()=>{
      immediateScroll(position.y);synchronize();
    },onComplete:()=>{
      chapterTween=null;
      if(chapter===3){handoffPending=true;scheduleHandoff()}
      else completeIntroIfReached();
    }});
  }
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
    chapterTween?.kill();chapterTween=null;chapter=0;
    gates=[];
    ready=true;
    if(mediaQuery.matches||!window.gsap||!window.ScrollTrigger){staticMode();return}
    document.documentElement.classList.add('intro-running');
    // Native CSS scroll snapping fights the frame-by-frame chapter movement
    // and can pull every animation frame back to the opening position.
    document.documentElement.style.scrollSnapType='none';
    document.documentElement.style.scrollBehavior='auto';
    document.body.classList.remove('journey-static');document.body.classList.add('motion-enabled');
    gsap.registerPlugin(ScrollTrigger);
    if(innerWidth<=1024){
      // A longer runway lets visitors who flick-scroll still see Face B and
      // today's selections before the catalogue takes over.
      q('#journey').style.height=`${layoutHeight*5.6}px`;
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
    // Three deliberate chapters: the cover gets a moment of focus, the
    // selections get a second moment of focus, and only then does browsing
    // continue into the catalogue.
    timeline.addLabel('grid',0)
      .fromTo(state,{zoom:0},{zoom:1,duration:2.6,ease:'power1.inOut'},0)
      .addLabel('featured',2.6)
      // A true hold on Diana Krall's cover before the next scroll flips it.
      .to(state,{zoom:1,duration:1},'featured')
      .addLabel('flip',3.6).fromTo(state,{flip:0},{flip:1,duration:1.7,ease:'power1.inOut'},'flip')
      .fromTo(state,{cards:0},{cards:1,duration:1,ease:'power1.out'},5.3)
      .addLabel('selections',6.3);
    // Give today's selections a longer reading pause before the catalogue.
    timeline.to(state,{cards:1,duration:2.3},'selections').addLabel('catalogue',8.6);
    // Build all tweens before attaching ScrollTrigger. Fixed from-values prevent
    // a rebuild at mid-scroll from capturing that frame as the new start state.
    gates=[
      {name:'featured',progress:timeline.labels.featured/timeline.duration()},
      {name:'selections',progress:timeline.labels.selections/timeline.duration()}
    ];
    ScrollTrigger.create({id:'maison-sillon-journey',animation:timeline,
      trigger:'#journey',start:'top top',end:()=>q('#journey').offsetTop+q('#journey').offsetHeight-(innerWidth<=1024?layoutHeight:innerHeight),scrub:.45,
      // Do not use ScrollTrigger's snap here. It cannot prevent a large wheel
      // or touch gesture from skipping an editorial stop.
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
  function immediateScroll(top){
    window.scrollTo({top:Math.round(top),left:scrollX,behavior:'instant'});
  }
  function gateScrollPosition(index){
    const trigger=timeline?.scrollTrigger,gate=gates[index];
    if(!trigger||!gate)return scrollY;
    return trigger.start+(trigger.end-trigger.start)*gate.progress;
  }
  // Recheck after image/font layout and when returning from browser page cache.
  addEventListener('load',()=>{if(ready){window.ScrollTrigger?.refresh();synchronize()}});
  addEventListener('pageshow',()=>requestAnimationFrame(()=>{if(ready){window.ScrollTrigger?.refresh();synchronize()}}));
  document.fonts?.ready.then(()=>{if(ready){window.ScrollTrigger?.refresh();synchronize()}});
  function goToCatalogue(){
    const target=q('#catalogue').offsetTop;
    // The explicit CTA is allowed to move straight to browsing; it is not a
    // missed scroll gesture.
    gateBypassUntil=performance.now()+1600;
    chapterTween?.kill();chapterTween=null;chapter=3;
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
    if(controlsIntro()&&(chapter<3||chapterTween)){handoffPending=false;return}
    const reached=innerWidth<=650?scrollY>=timeline.scrollTrigger.end:q('#catalogue').getBoundingClientRect().top<=0;
    if(reached)handoffPending=true;
    else handoffPending=false;
    scheduleHandoff();
  }
  // Wait for finger release and the end of momentum before removing the
  // completed introduction. The two gates above intentionally intercept only
  // the transitions into the featured and selections chapters.
  document.addEventListener('touchstart',event=>{
    touching=true;clearTimeout(settleTimer);
    touchStartY=event.touches[0]?.clientY||0;touchConsumed=!!chapterTween;
  },{passive:true});
  // Once a swipe lands at a stop, prevent that same swipe's remaining momentum
  // from travelling through the next chapter.
  document.addEventListener('touchmove',event=>{
    if(!controlsIntro()||event.touches.length!==1)return;
    event.preventDefault();
    const distance=touchStartY-event.touches[0].clientY;
    if(!touchConsumed&&Math.abs(distance)>22){touchConsumed=true;advanceChapter(distance>0?1:-1)}
  },{passive:false});
  document.addEventListener('wheel',event=>{
    if(!controlsIntro()||event.ctrlKey)return;
    event.preventDefault();
    const now=performance.now(),fresh=now-lastWheelAt>240;
    lastWheelAt=now;
    if(fresh&&Math.abs(event.deltaY)>1)advanceChapter(event.deltaY>0?1:-1);
  },{passive:false,capture:true});
  document.addEventListener('keydown',event=>{
    if(!controlsIntro()||event.target.closest('input,textarea,select,button,a,[contenteditable]'))return;
    if(!['ArrowDown','ArrowUp','PageDown','PageUp',' ','End','Home'].includes(event.key))return;
    event.preventDefault();
    if(!event.repeat)advanceChapter(['ArrowUp','PageUp','Home'].includes(event.key)||event.shiftKey?-1:1);
  });
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
    gates=[];chapterTween?.kill();chapterTween=null;chapter=0;lastWheelAt=-Infinity;
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
