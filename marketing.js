
(function(){
  var b=document.querySelector('.hamb'), n=document.querySelector('.nav-links');
  if(b&&n)b.addEventListener('click',function(){n.classList.toggle('open');b.setAttribute('aria-expanded',n.classList.contains('open'));});
  document.querySelectorAll('.nav-links a').forEach(function(a){a.addEventListener('click',function(){if(n)n.classList.remove('open')})});
  try{
    !function(w,d,t){w.TiktokAnalyticsObject=t;var q=w[t]=w[t]||[];q.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],q.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<q.methods.length;i++)q.setAndDefer(q,q.methods[i]);q.instance=function(t){for(var e=q._i[t]||[],n=0;n<q.methods.length;n++)q.setAndDefer(e,q.methods[n]);return e},q.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";q._i=q._i||{},q._i[e]=[],q._i[e]._u=r,q._t=q._t||{},q._t[e]=+new Date,q._o=q._o||{},q._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";s.async=!0;s.src=r+"?sdkid="+e+"&lib="+t;var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x)};q.load("DAIGL6RC77UC8FLK30DG");q.page()}(window,document,"ttq");
  }catch(e){}
})();
