(function(){
  if(window.__NAVIGAM_PROTECTION__)return;
  window.__NAVIGAM_PROTECTION__=true;
  document.documentElement.classList.add('nav-protected');

  function idSuffix(){
    var q=new URLSearchParams(location.search);
    var raw=(location.pathname.match(/^\/p\/([^/]+)/i)||[])[1]||q.get('code')||q.get('token')||'';
    raw=String(raw||'').replace(/[^A-Za-z0-9]/g,'');
    return raw?raw.slice(-6).toUpperCase():'PERSONAL';
  }
  var suffix=idSuffix();
  var wm=document.createElement('div');
  wm.className='nav-protected-watermark';
  wm.setAttribute('aria-hidden','true');
  var label='NAVIGAM · שימוש אישי בלבד · '+suffix;
  for(var i=0;i<24;i++){var s=document.createElement('span');s.textContent=label;wm.appendChild(s)}
  document.body.appendChild(wm);

  var badge=document.createElement('div');
  badge.className='nav-protected-badge';
  badge.textContent='NAVIGAM · שימוש אישי בלבד · '+suffix;
  badge.setAttribute('aria-hidden','true');
  document.body.appendChild(badge);

  var toast=document.createElement('div');
  toast.className='nav-protected-toast';
  toast.textContent='התוכן מיועד לשימוש אישי בלבד ואינו מיועד להעתקה, צילום, הקלטה או הפצה.';
  document.body.appendChild(toast);
  var t;
  function warn(){
    clearTimeout(t);toast.classList.add('show');t=setTimeout(function(){toast.classList.remove('show')},2200);
  }

  var print=document.createElement('div');
  print.className='nav-protected-print';
  print.textContent='NAVIGAM · התוכן מיועד לשימוש אישי בלבד. הדפסה והעתקה אינן מורשות.';
  document.body.appendChild(print);

  document.addEventListener('contextmenu',function(e){e.preventDefault();warn()},true);
  document.addEventListener('dragstart',function(e){e.preventDefault()},true);
  document.addEventListener('copy',function(e){
    var tag=(e.target&&e.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea')return;
    e.preventDefault();warn();
  },true);
  document.addEventListener('cut',function(e){
    var tag=(e.target&&e.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea')return;
    e.preventDefault();warn();
  },true);
  document.addEventListener('keydown',function(e){
    var k=String(e.key||'').toLowerCase();
    if(k==='printscreen'){document.body.style.filter='blur(12px)';warn();setTimeout(function(){document.body.style.filter=''},900);return}
    if((e.ctrlKey||e.metaKey)&&['s','u','p'].includes(k)){e.preventDefault();warn()}
    if((e.ctrlKey||e.metaKey)&&k==='c'){
      var tag=(e.target&&e.target.tagName||'').toLowerCase();
      if(tag!=='input'&&tag!=='textarea'){e.preventDefault();warn()}
    }
  },true);
  window.addEventListener('beforeprint',function(){warn()});
})();