/**
 * Lightweight event-delegation tracker.
 * Replaces per-element React client components (RepairTrackedLink, AffiliateLink,
 * RepairSectionTracker, KnowledgeGraphGroup impression/click tracking) with a
 * single <script> that runs after hydration via requestIdleCallback.
 *
 * Data attributes on server-rendered HTML:
 *   data-track-click="<json>"   → fires on click
 *   data-track-impression="<json>" → fires on IntersectionObserver hit
 *
 * This avoids hydrating dozens of thin client components just for analytics,
 * which is the #1 INP bottleneck on mobile.
 */

const TRACKING_SCRIPT = `
(function(){
  if(typeof window==='undefined')return;
  function fire(name,detail){
    try{
      if(window.gtag){
        window.gtag('event',name,detail);
      }
    }catch(e){}
  }
  function setup(){
    // Click tracking via event delegation
    document.addEventListener('click',function(e){
      var el=e.target;
      while(el&&el!==document){
        var d=el.getAttribute('data-track-click');
        if(d){try{fire('track_click',JSON.parse(d));}catch(e){} return;}
        el=el.parentElement;
      }
    });
    // Impression tracking via IntersectionObserver
    if(typeof IntersectionObserver!=='undefined'){
      var obs=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting)return;
          var d=entry.target.getAttribute('data-track-impression');
          if(d){try{fire('track_impression',JSON.parse(d));}catch(e){}}
          obs.unobserve(entry.target);
        });
      },{threshold:0.35,rootMargin:'0px 0px -15% 0px'});
      document.querySelectorAll('[data-track-impression]').forEach(function(el){
        obs.observe(el);
      });
    }
  }
  if('requestIdleCallback' in window){
    requestIdleCallback(setup,{timeout:5000});
  }else{
    setTimeout(setup,2000);
  }
})();
`;

export default function TrackingScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: TRACKING_SCRIPT }}
    />
  );
}
