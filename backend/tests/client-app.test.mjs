import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../../app/index.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
async function render(language,data,search='?token=synthetic'){
 const nodes=new Map(),root={};let requests=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{classList:{add(){}},textContent:'',innerHTML:'',hidden:true});return nodes.get(id)};
 const context={URL,URLSearchParams,navigator:{language},location:{search},document:{documentElement:root,querySelector:node},fetch:async()=>{requests++;return {ok:true,json:async()=>data}}};
 runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 return {nodes,root,context,requests};
}
test('client app uses Russian fallbacks, LTR, and preserves server translations',async()=>{
 const r=await render('he',{language:'ru',trip:{},days:[],places:[],i18n:{navigation:{food:'Кухня'}}});
 assert.equal(r.root.dir,'ltr');assert.equal(r.nodes.get('#navFood').textContent,'Кухня');
 assert.match(r.nodes.get('#scheduleList').innerHTML,/Маршрут ещё готовится/);
 assert.match(r.nodes.get('#usefulList').innerHTML,/Перелёты/);
 assert.equal(r.nodes.get('#app').hidden,false);
});
test('Arabic app localizes empty day and place states with RTL',async()=>{
 const r=await render('he',{language:'ar',trip:{},days:[{id:'day1',title:'اليوم الأول'}],places:[]});
 assert.equal(r.root.dir,'rtl');assert.match(r.nodes.get('#scheduleList').innerHTML,/لا توجد أنشطة/);
 assert.match(r.nodes.get('#placesList').innerHTML,/لا توجد أماكن/);
});
test('place actions reject executable and credential URLs while preserving safe links',async()=>{
 const r=await render('he',{language:'he',trip:{},places:[{name:'<script>bad</script>',website:'javascript:alert(1)',booking_url:'https://user:pass@example.com',google_maps_url:'https://maps.google.com/?q=Haifa',whatsapp:'+972 50 000 0000'}]});
 const html=r.nodes.get('#placesList').innerHTML;
 assert.doesNotMatch(html,/javascript:|user:pass|<script>/);
 assert.match(html,/https:\/\/maps.google.com/);assert.match(html,/https:\/\/wa.me\/972500000000/);
 assert.match(html,/&lt;script&gt;/);
 for(const url of ['data:text/html,bad','file:///etc/passwd','//example.com','https://'])assert.equal(runInNewContext('safeUrl('+JSON.stringify(url)+')',r.context),null);
});
test('missing client token makes no API request and shows localized error',async()=>{
 const r=await render('ru-RU',null,'');assert.equal(r.requests,0);assert.match(r.nodes.get('#load').textContent,/Не удалось/);
});
