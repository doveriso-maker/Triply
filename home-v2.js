(function(){
  var navBtn=document.querySelector('.hamb');
  var nav=document.querySelector('.nav-links');
  var range=document.getElementById('daysRange');
  var minus=document.getElementById('daysMinus');
  var plus=document.getElementById('daysPlus');
  var daysValue=document.getElementById('daysValue');
  var extraRow=document.getElementById('extraRow');
  var extraLabel=document.getElementById('extraLabel');
  var extraPrice=document.getElementById('extraPrice');
  var totalPrice=document.getElementById('totalPrice');
  var calcWa=document.getElementById('calculatorWhatsApp');
  var lang=(document.documentElement.lang||'he').toLowerCase().slice(0,2);

  var copy={
    he:{
      one:'יום נוסף אחד',
      many:function(n){return n+' ימים נוספים';},
      msg:function(days,total){return 'היי אביה 👋 חישבתי באתר NAVIGAM טיול של '+days+' ימים במחיר '+total+' ₪, ואני רוצה להתחיל לתכנן.';}
    },
    en:{
      one:'1 additional day',
      many:function(n){return n+' additional days';},
      msg:function(days,total){return 'Hi Avia 👋 I used the NAVIGAM calculator for a '+days+'-day trip at '+total+' ₪, and I want to start planning.';}
    },
    ar:{
      one:'يوم إضافي واحد',
      many:function(n){return n+' أيام إضافية';},
      msg:function(days,total){return 'مرحباً أفيا 👋 حسبت على موقع NAVIGAM رحلة لمدة '+days+' أيام بسعر '+total+' ₪، وأريد أن أبدأ التخطيط.';}
    },
    ru:{
      one:'1 дополнительный день',
      many:function(n){return n+' дополнительных дней';},
      msg:function(days,total){return 'Привет, Авия 👋 Я рассчитал на NAVIGAM поездку на '+days+' дней за '+total+' ₪ и хочу начать планирование.';}
    }
  };
  var L=copy[lang]||copy.he;

  if(navBtn&&nav){
    navBtn.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded',open?'true':'false');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){
        nav.classList.remove('open');
        navBtn.setAttribute('aria-expanded','false');
      });
    });
  }

  function priceFor(days){
    return 169 + Math.max(0,days-4)*25;
  }
  function updateCalculator(next){
    if(!range)return;
    var days=Math.max(4,Math.min(21,Number(next)||4));
    range.value=String(days);
    var extra=Math.max(0,days-4);
    var total=priceFor(days);
    if(daysValue)daysValue.textContent=days;
    if(extraRow)extraRow.hidden=extra===0;
    if(extraLabel)extraLabel.textContent=extra===1?L.one:L.many(extra);
    if(extraPrice)extraPrice.textContent=(extra*25)+' ₪';
    if(totalPrice)totalPrice.textContent=total+' ₪';
    if(calcWa){
      calcWa.href='https://wa.me/972557760288?text='+encodeURIComponent(L.msg(days,total));
    }
  }

  if(range){
    range.addEventListener('input',function(){updateCalculator(range.value)});
    if(minus)minus.addEventListener('click',function(){updateCalculator(Number(range.value)-1)});
    if(plus)plus.addEventListener('click',function(){updateCalculator(Number(range.value)+1)});
    updateCalculator(range.value);
  }
})();