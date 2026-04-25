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
  var startTs = Date.now();
  var scrollMilestones = {25:false,50:false,75:false,100:false};
  function fire(name,detail){
    try{
      if(window.gtag){
        window.gtag('event',name,detail);
      }
    }catch(e){}
  }
  function setup(){
    fire('page_view_custom',{
      page_path: window.location.pathname,
      page_type: document.body && document.body.getAttribute('data-page-type') || 'unknown',
    });
    // Click tracking via event delegation
    document.addEventListener('click',function(e){
      var el=e.target;
      while(el&&el!==document){
        var d=el.getAttribute('data-track-click');
        if(d){
          try{
            var data=JSON.parse(d);
            var ev=data.event_name||'track_click';
            if(data.event_category==='repair_answer') ev='repair_answer_click';
            else if(data.event_category==='kg_click') ev='knowledge_graph_click';
            else if(data.event_category==='affiliate_click') ev='affiliate_click';
            else if(data.event_category==='vin_decoder') ev='vin_decoder_usage';
            else if(data.event_category==='quote_request') ev='quote_request_submission';
            else if(data.event_category==='email_capture') ev='email_capture_conversion';
            else if(data.event_category==='diagnosis') ev='diagnosis_start';
            delete data.event_name;
            fire(ev,data);
          }catch(e){} 
          return;
        }
        el=el.parentElement;
      }
    });
    // Submit tracking via event delegation
    document.addEventListener('submit',function(e){
      var el=e.target;
      if(!el || !el.getAttribute) return;
      var d=el.getAttribute('data-track-submit');
      if(!d) return;
      try{
        var data=JSON.parse(d);
        var ev=data.event_name||'form_submit';
        if(data.event_category==='quote_request') ev='quote_request_submission';
        else if(data.event_category==='email_capture') ev='email_capture_conversion';
        else if(data.event_category==='diagnosis') ev='diagnosis_start';
        delete data.event_name;
        fire(ev,data);
      }catch(err){}
    },true);
    // Impression tracking via IntersectionObserver
    if(typeof IntersectionObserver!=='undefined'){
      var obs=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting)return;
          var d=entry.target.getAttribute('data-track-impression');
          if(d){
            try{
              var data=JSON.parse(d);
              var ev=data.event_name||'track_impression';
              if(data.event_category==='repair_answer') ev='repair_answer_impression';
              else if(data.event_category==='kg_impression') ev='knowledge_graph_impression';
              delete data.event_name;
              fire(ev,data);
            }catch(e){}
          }
          obs.unobserve(entry.target);
        });
      },{threshold:0.35,rootMargin:'0px 0px -15% 0px'});
      document.querySelectorAll('[data-track-impression]').forEach(function(el){
        obs.observe(el);
      });
    }
    function updateScrollDepth(){
      var doc=document.documentElement;
      var top=(window.scrollY||doc.scrollTop||0);
      var h=Math.max(1,doc.scrollHeight-window.innerHeight);
      var pct=Math.round((top/h)*100);
      [25,50,75,100].forEach(function(m){
        if(pct>=m && !scrollMilestones[m]){
          scrollMilestones[m]=true;
          fire('scroll_depth',{depth_percent:m,page_path:window.location.pathname});
        }
      });
    }
    window.addEventListener('scroll',updateScrollDepth,{passive:true});
    updateScrollDepth();

    var heartbeat=[30,60,120,300];
    heartbeat.forEach(function(sec){
      setTimeout(function(){
        fire('time_on_page',{seconds:sec,page_path:window.location.pathname});
      },sec*1000);
    });
    window.addEventListener('beforeunload',function(){
      var seconds=Math.round((Date.now()-startTs)/1000);
      fire('time_on_page_exit',{seconds:seconds,page_path:window.location.pathname});
    });
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
