(function(){
'use strict';
var BASE=document.body.getAttribute('data-base')||'';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var WA='919417977016',MAIL='batraestate@gmail.com',ASOF='29 October 2026';

/* ---- menu */
var burger=$('.burger'),nav=$('#nav');
if(burger&&nav){
  burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false')});
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');burger.setAttribute('aria-expanded','false');burger.focus()}});
  $$('a',nav).forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');burger.setAttribute('aria-expanded','false')})});
}

/* ---- reveal on scroll */
(function(){
  var els=$$('.rv');if(!els.length)return;
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.05});
  els.forEach(function(e){io.observe(e)});
})();

/* ---- data + saved list */
var dataEl=$('#listings'),DATA=[];
try{DATA=dataEl?JSON.parse(dataEl.textContent):[]}catch(x){DATA=[]}
var byId={};DATA.forEach(function(l){byId[l.id]=l});
var KEY='batra-estate-saved',saved=[];
try{saved=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(x){saved=[]}
if(!Array.isArray(saved))saved=[];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(x){}}
function isSaved(id){return saved.indexOf(id)>-1}
function toggle(id,on){var i=saved.indexOf(id);if(on===undefined)on=i<0;if(on&&i<0)saved.push(id);if(!on&&i>-1)saved.splice(i,1);persist();sync()}
var listeners=[];
function sync(){
  $$('[data-sl-count]').forEach(function(c){c.textContent=saved.length;c.setAttribute('data-n',saved.length)});
  $$('[data-save]').forEach(function(b){var on=isSaved(b.getAttribute('data-save'));b.setAttribute('aria-pressed',on?'true':'false');var s=$('.sr',b);if(s)s.textContent=on?'Remove this house from your shortlist':'Save this house to your shortlist'});
  $$('input[data-pick]').forEach(function(c){c.checked=isSaved(c.getAttribute('data-pick'))});
  listeners.forEach(function(f){f()});
}
document.addEventListener('click',function(ev){
  var s=ev.target.closest('[data-save]');if(s){toggle(s.getAttribute('data-save'))}
});
document.addEventListener('change',function(ev){var c=ev.target.closest('input[data-pick]');if(c)toggle(c.getAttribute('data-pick'),c.checked)});

/* ---- helpers */
function cr(v){var s=(Math.round(v*100)/100).toString();return '₹'+s+' Cr'}
function plotLabel(l){return l.marla?(l.marla===20?'1 kanal':l.marla+' marla'):'Plot size on request'}
function fdate(s){var d=new Date(s+'T00:00:00');return d.getDate()+' '+d.toLocaleString('en-GB',{month:'short'})+' '+d.getFullYear()}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function line(l){return 'Sector '+l.sector+' · '+l.bhk+' BHK · '+plotLabel(l)+' · '+cr(l.price_cr)+' (Magicbricks ref '+l.id+')'}
function houseWA(l){return 'Hello Batra Estate, I would like to visit this house I saw on your website: '+line(l)+'.'}
function waUrl(t){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)}

/* ---- dialog */
var dlg=$('#dlg');
function openHouse(id,focusBack){
  var l=byId[id];if(!l||!dlg)return;
  var rows=[['Plot',plotLabel(l)+(l.plot_src&&l.plot_src!=='listing text'?' (from '+l.plot_src+')':'')],['Area on the listing',l.area],['Storeys',l.storeys],['Facing',l.facing],['Bathrooms',l.baths],['Balconies',l.balconies],['Parking',l.parking],['Age of construction',l.age],['Overlooking',l.view],['Ownership',l.ownership],['Status',l.status],['Furnishing',l.furnishing],['Last posted',fdate(l.posted)]];
  var dl=rows.filter(function(r){return r[1]}).map(function(r){return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('');
  var tags=l.tags.length?'<ul class="tags">'+l.tags.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul>':'';
  var note=l.note?'<p class="dl-note">In the listing’s words: “'+esc(l.note)+'”</p>':'';
  $('#dlg-body').innerHTML='<p class="dl-sec">Sector '+l.sector+', Panchkula</p><h2 class="dl-price" id="dlg-t">'+cr(l.price_cr)+'</h2><p class="dl-spec">'+l.bhk+' BHK independent house</p>'+tags+'<div class="dl-act"><a class="btn" target="_blank" rel="noopener" href="'+waUrl(houseWA(l))+'" data-goatcounter-click="whatsapp-house" data-goatcounter-title="WhatsApp this house">Ask about this house</a><button class="btn btn-ghost" type="button" data-save="'+l.id+'" aria-pressed="false"><span class="sr"></span>Save to shortlist</button><a class="btn btn-ghost" target="_blank" rel="noopener" href="'+esc(l.url)+'" data-goatcounter-click="magicbricks" data-goatcounter-title="Magicbricks listing">Listing on Magicbricks</a></div>'+'<dl class="spec">'+dl+'</dl>'+note+
   '<p class="dl-fine">Listing as shown on Magicbricks, '+ASOF+'. Photos are on the Magicbricks listing. Price and availability are confirmed by Batra Estate.</p>';
  dlg.__back=focusBack||null;
  if(typeof dlg.showModal==='function'){dlg.showModal()}else{dlg.setAttribute('open','')}
  document.body.style.overflow='hidden';sync();
  try{history.replaceState(null,'','#h-'+id)}catch(x){}
}
function closeDlg(){if(!dlg)return;if(dlg.close)dlg.close();else dlg.removeAttribute('open')}
if(dlg){
  dlg.addEventListener('close',function(){document.body.style.overflow='';if(dlg.__back&&document.contains(dlg.__back))dlg.__back.focus();try{history.replaceState(null,'',location.pathname+location.search)}catch(x){}});
  dlg.addEventListener('click',function(ev){if(ev.target===dlg||ev.target.closest('[data-close]'))closeDlg()});
}
document.addEventListener('click',function(ev){var o=ev.target.closest('[data-open]');if(o)openHouse(o.getAttribute('data-open'),o)});

/* ---- browse page */
var grid=$('#grid');
if(grid){
  var cards=$$('.hc',grid),fs={sectors:[],bhk:[],max:null};
  var pr=$('#f-price'),pv=$('#f-pv'),srt=$('#f-sort'),cnt=$('#f-count'),emp=$('#empty');
  var PMAX=parseFloat(pr.max);
  var qs=new URLSearchParams(location.search);
  if(qs.get('sector'))fs.sectors=qs.get('sector').split(',').map(Number).filter(Boolean);
  if(qs.get('bhk'))fs.bhk=qs.get('bhk').split(',').map(Number).filter(Boolean);
  if(qs.get('max')){var m=parseFloat(qs.get('max'));if(m)pr.value=Math.min(PMAX,m)}
  function chipState(){
    $$('[data-f-sector]').forEach(function(c){c.setAttribute('aria-pressed',fs.sectors.indexOf(+c.getAttribute('data-f-sector'))>-1?'true':'false')});
    $$('[data-f-bhk]').forEach(function(c){c.setAttribute('aria-pressed',fs.bhk.indexOf(+c.getAttribute('data-f-bhk'))>-1?'true':'false')});
  }
  function apply(){
    var max=parseFloat(pr.value);pv.textContent=cr(max);var shown=0;
    var arr=cards.map(function(c){return {c:c,s:+c.dataset.sector,b:+c.dataset.bhk,p:parseFloat(c.dataset.price),d:c.dataset.posted}});
    arr.forEach(function(x){
      var ok=(!fs.sectors.length||fs.sectors.indexOf(x.s)>-1)&&(!fs.bhk.length||fs.bhk.some(function(b){return b>=6?x.b>=6:x.b===b}))&&x.p<=max+1e-9;
      x.c.hidden=!ok;if(ok)shown++;
    });
    var mode=srt.value;
    arr.slice().sort(function(a,b){return mode==='low'?a.p-b.p:mode==='high'?b.p-a.p:mode==='sector'?a.s-b.s||a.p-b.p:(a.d<b.d?1:a.d>b.d?-1:a.s-b.s)}).forEach(function(x,i){x.c.style.order=i});
    cnt.textContent=shown+' of '+cards.length+' houses';emp.hidden=shown>0;chipState();
  }
  $$('[data-f-sector]').forEach(function(c){c.addEventListener('click',function(){var v=+c.getAttribute('data-f-sector'),i=fs.sectors.indexOf(v);i>-1?fs.sectors.splice(i,1):fs.sectors.push(v);apply()})});
  $$('[data-f-bhk]').forEach(function(c){c.addEventListener('click',function(){var v=+c.getAttribute('data-f-bhk'),i=fs.bhk.indexOf(v);i>-1?fs.bhk.splice(i,1):fs.bhk.push(v);apply()})});
  pr.addEventListener('input',apply);srt.addEventListener('change',apply);
  $('#f-reset').addEventListener('click',function(){fs.sectors=[];fs.bhk=[];pr.value=PMAX;srt.value='new';apply()});
  apply();
  if(location.hash.indexOf('#h-')===0){var hid=location.hash.slice(3);if(byId[hid]){var tc=document.getElementById('h-'+hid);if(tc)tc.hidden=false;openHouse(hid,null)}}
}

/* ---- shortlist tool */
var tool=$('#tool');
if(tool){
  var T={budget:10,bhk:3,plot:0,sectors:[],must:[],face:''};
  var q=new URLSearchParams(location.search);
  if(q.get('budget')){var b0=parseFloat(q.get('budget'));if(b0)T.budget=Math.min(30,Math.max(6,b0))}
  if(q.get('bhk')){var k0=parseInt(q.get('bhk'),10);if(k0)T.bhk=Math.min(6,Math.max(3,k0))}
  var rb=$('#t-budget'),bv=$('#t-bv'),fit=$('#res-fit'),near=$('#res-near'),nearW=$('#res-near-w'),sum=$('#res-sum'),fitH=$('#fit-h'),svW=$('#res-saved-w'),sv=$('#res-saved');
  rb.value=T.budget;
  function tcard(l,why,miss,dim){
    var spec=l.bhk+' BHK · '+plotLabel(l)+(l.storeys?' · '+l.storeys:'');
    return '<article class="hc'+(dim?' dim':'')+'" data-id="'+l.id+'"><div class="hc-top"><span class="hc-sec">Sector <b>'+l.sector+'</b></span><span class="hc-date">Listed '+fdate(l.posted)+'</span></div><p class="hc-price">'+cr(l.price_cr)+'</p><p class="hc-spec">'+esc(spec)+'</p>'+
      (miss?'<span class="why-miss">'+esc(miss)+'</span>':'')+(why&&why.length?'<ul class="why">'+why.map(function(w){return '<li>'+esc(w)+'</li>'}).join('')+'</ul>':'')+
      '<div class="hc-act"><button class="btn btn-ghost btn-sm" type="button" data-open="'+l.id+'">Details</button><label class="hc-pick"><input type="checkbox" data-pick="'+l.id+'"'+(isSaved(l.id)?' checked':'')+'><i class="bx" aria-hidden="true"></i>Visit list</label></div></article>';
  }
  function evalOne(l){
    var miss=[],why=[];
    var over=l.price_cr-T.budget;
    if(over>1e-9)miss.push({k:'budget',t:cr(over)+' over your budget',soft:over<=T.budget*.25});else why.push(cr(l.price_cr)+(over<-0.005?', '+cr(-over)+' under your budget':', right at your budget'));
    if(l.bhk<T.bhk)miss.push({k:'bhk',t:l.bhk+' BHK, you asked for '+T.bhk+'+',soft:true});else if(T.bhk>3||l.bhk>3)why.push(l.bhk+' BHK');
    if(T.plot){if(l.marla&&l.marla<T.plot)miss.push({k:'plot',t:plotLabel(l)+' plot, you asked for '+(T.plot===20?'1 kanal':T.plot+' marla +'),soft:true});else if(l.marla)why.push(plotLabel(l)+' plot');else why.push('Plot size not stated on the listing')}
    if(T.sectors.length){if(T.sectors.indexOf(l.sector)<0)miss.push({k:'sector',t:'Sector '+l.sector+' is not in your list',soft:true});else why.push('Sector '+l.sector+', one you chose')}
    T.must.forEach(function(m){if(l.tags.indexOf(m)<0)miss.push({k:'must:'+m,t:'Listing does not mention: '+m.toLowerCase(),soft:true});else why.push('Listing mentions: '+m.toLowerCase())});
    if(T.face){var f=(l.facing||'');if(f.toLowerCase().split(/[\s-]+/).indexOf(T.face.toLowerCase())<0)miss.push({k:'face',t:f?'Faces '+f.toLowerCase():'Facing not stated',soft:true});else why.push('Faces '+f.toLowerCase())}
    return {l:l,miss:miss,why:why.slice(0,5)};
  }
  function run(){
    bv.textContent=cr(T.budget);
    $$('[data-t-bhk]').forEach(function(c){c.setAttribute('aria-pressed',+c.getAttribute('data-t-bhk')===T.bhk?'true':'false')});
    $$('[data-t-plot]').forEach(function(c){c.setAttribute('aria-pressed',+c.getAttribute('data-t-plot')===T.plot?'true':'false')});
    $$('[data-t-sector]').forEach(function(c){c.setAttribute('aria-pressed',T.sectors.indexOf(+c.getAttribute('data-t-sector'))>-1?'true':'false')});
    $$('[data-t-must]').forEach(function(c){c.setAttribute('aria-pressed',T.must.indexOf(c.getAttribute('data-t-must'))>-1?'true':'false')});
    var ev=DATA.map(evalOne);
    var f=ev.filter(function(x){return !x.miss.length}).sort(function(a,b){return a.l.price_cr-b.l.price_cr});
    var n=ev.filter(function(x){return x.miss.length===1&&x.miss[0].soft}).sort(function(a,b){return a.l.price_cr-b.l.price_cr}).slice(0,6);
    fit.innerHTML=f.map(function(x){return tcard(x.l,x.why)}).join('');
    fitH.hidden=!f.length;
    if(!f.length)fit.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>No house fits all of that yet</h3><p>Raise the budget a little or drop a must-have. The houses that come closest are below.</p></div>';
    near.innerHTML=n.map(function(x){return tcard(x.l,x.why.slice(0,2),x.miss[0].t,true)}).join('');
    nearW.hidden=!n.length;
    sum.textContent=f.length+' of '+DATA.length+' houses fit'+(n.length?' · '+n.length+' nearly':'');
    renderSaved();
  }
  function renderSaved(){
    var ids=saved.filter(function(i){return byId[i]});
    svW.hidden=!ids.length;sv.innerHTML=ids.map(function(i){return tcard(byId[i],[])}).join('');
    // checkbox state sync inside re-rendered cards
    $$('input[data-pick]').forEach(function(c){c.checked=isSaved(c.getAttribute('data-pick'))});
    var bar=$('#vbar');bar.hidden=!ids.length;
    document.body.classList.toggle('has-vbar',!!ids.length);
    $('#vb-n').textContent=ids.length;$('#vb-t').textContent=ids.length===1?'house on your visit list':'houses on your visit list';
    if(ids.length){
      var txt='Hello Batra Estate, I would like to visit these houses I shortlisted on your website:\n'+ids.map(function(i,k){return (k+1)+'. '+line(byId[i])}).join('\n')+'\n\nMy search: budget up to '+cr(T.budget)+', '+T.bhk+'+ BHK'+(T.plot?', plot '+(T.plot===20?'1 kanal':T.plot+' marla +'):'')+(T.sectors.length?', sectors '+T.sectors.sort(function(a,b){return a-b}).join(', '):'')+'.\nPlease tell me a day I can visit. My name: ';
      $('#vb-wa').href=waUrl(txt);
      $('#vb-mail').href='mailto:'+MAIL+'?subject='+encodeURIComponent('Visit request: '+ids.length+(ids.length===1?' house':' houses')+' in Panchkula')+'&body='+encodeURIComponent(txt);
    }
  }
  listeners.push(renderSaved);
  rb.addEventListener('input',function(){T.budget=parseFloat(rb.value);run()});
  $$('[data-t-bhk]').forEach(function(c){c.addEventListener('click',function(){T.bhk=+c.getAttribute('data-t-bhk');run()})});
  $$('[data-t-plot]').forEach(function(c){c.addEventListener('click',function(){T.plot=+c.getAttribute('data-t-plot');run()})});
  $$('[data-t-sector]').forEach(function(c){c.addEventListener('click',function(){var v=+c.getAttribute('data-t-sector'),i=T.sectors.indexOf(v);i>-1?T.sectors.splice(i,1):T.sectors.push(v);run()})});
  $$('[data-t-must]').forEach(function(c){c.addEventListener('click',function(){var v=c.getAttribute('data-t-must'),i=T.must.indexOf(v);i>-1?T.must.splice(i,1):T.must.push(v);run()})});
  $('#t-face').addEventListener('change',function(ev){T.face=ev.target.value;run()});
  $('#t-reset').addEventListener('click',function(){T={budget:10,bhk:3,plot:0,sectors:[],must:[],face:''};rb.value=10;$('#t-face').value='';run()});
  $('#vb-clear').addEventListener('click',function(){saved=[];persist();sync();run()});
  run();
}
sync();
})();
