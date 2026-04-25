'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CANONICAL_HOST } from '@/lib/host';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-WNFX6CY9RN';
const AHREFS_KEY = 'Id9DIK0mrHJtsEHStxIWNA';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';
const VWO_ACCOUNT_ID = process.env.NEXT_PUBLIC_VWO_ACCOUNT_ID || '';

export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.location.hostname !== CANONICAL_HOST) return;
    // Skip headless/automated browsers (Puppeteer, Playwright, etc.)
    if (navigator.webdriver) return;
    // Delay 3s to filter zero-engagement bot traffic (Singapore bots bounce in <1s)
    const timer = setTimeout(() => setEnabled(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: false
              });
            `}
          </Script>
        </>
      )}

      {CLARITY_ID && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}

      {VWO_ACCOUNT_ID && (
        <Script id="vwo-loader" strategy="afterInteractive">
          {`
            window._vwo_code = window._vwo_code || (function() {
              var account_id=${JSON.stringify(VWO_ACCOUNT_ID)},
              version=2.1,
              settings_tolerance=2000,
              hide_element='body',
              hide_element_style='opacity:0 !important;background:none !important',
              /* DO NOT EDIT BELOW THIS LINE */
              f=false,w=window,d=document,v=d.querySelector('#vwoCode'),cK='_vwo_'+account_id+'_settings',cc={};try{var c=JSON.parse(localStorage.getItem('_vwo_'+account_id+'_config'));cc=c&&typeof c==='object'?c:{}}catch(e){}var stT=cc.stT==='session'?w.sessionStorage:w.localStorage;
              code={use_existing_jquery:function(){return typeof use_existing_jquery!=='undefined'?use_existing_jquery:undefined},library_tolerance:function(){return typeof library_tolerance!=='undefined'?library_tolerance:undefined},settings_tolerance:function(){return cc.sT||settings_tolerance},hide_element_style:function(){return'{'+(cc.hES||hide_element_style)+'}'},hide_element:function(){if(performance.getEntriesByName('first-contentful-paint')[0]){return''}return typeof cc.hE==='string'?cc.hE:hide_element},getVersion:function(){return version},finish:function(e){if(!f){f=true;var t=d.getElementById('_vis_opt_path_hides');if(t)t.parentNode.removeChild(t);if(e)(new Image).src='https://dev.visualwebsiteoptimizer.com/ee.gif?a='+account_id+e}},finished:function(){return f},addScript:function(e){var t=d.createElement('script');t.type='text/javascript';if(e.src){t.src=e.src}else{t.text=e.text}d.getElementsByTagName('head')[0].appendChild(t)},load:function(e,t){var n=this.getSettings(),i=d.createElement('script'),r=this;t=t||{};if(n){i.textContent=n;d.getElementsByTagName('head')[0].appendChild(i);if(!w.VWO||VWO.caE){stT.removeItem(cK);r.load(e)}}else{var o=new XMLHttpRequest;o.open('GET',e,true);o.withCredentials=!t.d;o.responseType=t.responseType||'text';o.onload=function(){if(t.onloadCb){return t.onloadCb(o,e)}if(o.status===200||o.status===304){_vwo_code.addScript({text:o.responseText})}else{_vwo_code.finish('&e=loading_failed:'+e)}};o.onerror=function(){if(t.onerrorCb){return t.onerrorCb(e)}_vwo_code.finish('&e=loading_failed:'+e)};o.send()}},getSettings:function(){try{var e=stT.getItem(cK);if(!e){return}e=JSON.parse(e);if(Date.now()>e.e){stT.removeItem(cK);return}return e.s}catch(e){return}},init:function(){if(d.URL.indexOf('__vwo_disable__')>-1)return;var e=this.settings_tolerance();w._vwo_settings_timer=setTimeout(function(){_vwo_code.finish();stT.removeItem(cK)},e);var t=this.hide_element(),n=d.getElementsByTagName('head')[0],i=d.createElement('style');i.setAttribute('id','_vis_opt_path_hides');v&&i.setAttribute('nonce',v.nonce);i.setAttribute('type','text/css');if(t){i.textContent=t+this.hide_element_style();n.appendChild(i)}this.load('https://dev.visualwebsiteoptimizer.com/j.php?a='+account_id+'&u='+encodeURIComponent(d.URL)+'&vn='+version)},};
              w._vwo_code = code;
              code.init();
              return code;
            }());
          `}
        </Script>
      )}

      <Script id="ahrefs-deferred" strategy="lazyOnload">
        {`
          (function () {
            function loadAhrefs() {
              if (document.querySelector('script[data-ahrefs-analytics]')) return;
              var s = document.createElement('script');
              s.src = 'https://analytics.ahrefs.com/analytics.js';
              s.dataset.key = '${AHREFS_KEY}';
              s.dataset.ahrefsAnalytics = 'true';
              s.defer = true;
              document.head.appendChild(s);
            }
            if ('requestIdleCallback' in window) {
              requestIdleCallback(loadAhrefs, { timeout: 10000 });
            } else {
              setTimeout(loadAhrefs, 6000);
            }
          })();
        `}
      </Script>
    </>
  );
}
