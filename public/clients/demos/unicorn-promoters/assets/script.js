(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var D=JSON.parse(($('#up-data')||{textContent:'{"items":[]}'}).textContent),ITEMS=D.items,BY={};ITEMS.forEach(function(i){BY[i.i]=i});
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* nav */
var bg=$('.burger'),nav=$('#nav');if(bg){bg.addEventListener('click',function(){var o=nav.classList.toggle('open');bg.setAttribute('aria-expanded',o)});$$('a',nav).forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');bg.setAttribute('aria-expanded','false')})})}
/* reveal */
var rv=$$('[data-reveal]');if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});rv.forEach(function(e){io.observe(e)})}else rv.forEach(function(e){e.classList.add('in')});
/* shortlist */
var SL=[];try{SL=JSON.parse(localStorage.getItem('up-sl')||'[]').filter(function(i){return BY[i]})}catch(e){}
function save(){try{localStorage.setItem('up-sl',JSON.stringify(SL))}catch(e){}}
var sl=$('#sl'),dw=$('#dw'),scrim=$('.scrim');
function line(i){var parts=[i.n+' ('+i.l+')',i.k+(i.k!=='Plot'&&i.bt?', '+i.bt:'')];if(i.st)parts.push(i.st);parts.push(i.pt);return parts.join(' | ')}
var CTX='';
function msg(){var m='Hello Unicorn Promoters, I found these on your website and would like details and a site visit:\n';SL.forEach(function(id,n){m+=(n+1)+'. '+line(BY[id])+'\n'});if(CTX)m+='\nWhat I am looking for: '+CTX+'\n';return m+'\nPlease call me back. Thank you.'}
function renderSL(){
 $$('[data-sl-count]').forEach(function(e){e.textContent=SL.length});
 $$('[data-add]').forEach(function(b){var on=SL.indexOf(b.dataset.add)>-1;b.setAttribute('aria-pressed',on);var t=$('i',b);if(t)t.textContent=on?'Added':'Shortlist'});
 var ul=$('[data-sl-items]');if(!ul)return;
 ul.innerHTML=SL.map(function(id){var i=BY[id];return '<li><div><b>'+esc(i.n)+'</b><span>'+esc(i.l+' · '+i.k+' · '+i.pt)+'</span></div><button type="button" data-rm="'+id+'" aria-label="Remove '+esc(i.n)+'">&times;</button></li>'}).join('');
 $('[data-sl-empty]').hidden=SL.length>0;var ta=$('[data-sl-msg]');ta.hidden=!SL.length;ta.value=SL.length?msg():'';
 var m=SL.length?msg():'Hello Unicorn Promoters, I am looking at your website.';
 $('[data-sl-wa]').href='https://wa.me/'+D.wa+'?text='+encodeURIComponent(m);
 $('[data-sl-mail]').href='mailto:'+D.email+'?subject='+encodeURIComponent('Property enquiry')+'&body='+encodeURIComponent(m);
 $$('[data-sl-wa],[data-sl-mail],[data-sl-copy],[data-sl-clear]').forEach(function(b){b.hidden=!SL.length&&b.hasAttribute('data-sl-copy')})
}
function toggle(id){var k=SL.indexOf(id);if(k>-1)SL.splice(k,1);else SL.push(id);save();renderSL()}
var lastFocus=null;
function openPanel(p){closeAll(true);lastFocus=document.activeElement;p.hidden=false;scrim.hidden=false;document.body.style.overflow='hidden';var f=$('button,a',p);f&&f.focus()}
function closeAll(keep){[sl,dw].forEach(function(p){if(p)p.hidden=true});scrim.hidden=true;document.body.style.overflow='';if(!keep&&lastFocus&&lastFocus.focus)lastFocus.focus()}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll()});
document.addEventListener('click',function(e){
 var t=e.target.closest('[data-add],[data-rm],[data-open],[data-sl-open],[data-sl-close],[data-close-all],[data-sl-clear],[data-sl-copy],[data-dw-add]');if(!t)return;
 if(t.dataset.add){toggle(t.dataset.add)}
 else if(t.dataset.dwAdd){toggle(t.dataset.dwAdd);t.textContent=SL.indexOf(t.dataset.dwAdd)>-1?'Remove from shortlist':'Add to shortlist'}
 else if(t.dataset.rm){toggle(t.dataset.rm)}
 else if(t.dataset.open){openDetail(t.dataset.open)}
 else if(t.hasAttribute('data-sl-open')){renderSL();openPanel(sl)}
 else if(t.hasAttribute('data-sl-close')||t.hasAttribute('data-close-all')){closeAll()}
 else if(t.hasAttribute('data-sl-clear')){SL=[];save();renderSL()}
 else if(t.hasAttribute('data-sl-copy')){var ta=$('[data-sl-msg]');ta.select();try{navigator.clipboard.writeText(ta.value)}catch(x){document.execCommand('copy')};t.textContent='Copied'}
});
/* detail drawer */
function openDetail(id){var i=BY[id],h='';
 var wm='Hello Unicorn Promoters, I would like details and a site visit for '+i.n+' ('+i.l+').';
 var img=i.im?'<div class="dw-img"><img src="'+i.im+'" alt="'+esc(i.n+', '+i.l)+'" width="480" height="360"></div>':'';
 h=img+'<button class="x" type="button" data-close-all aria-label="Close details">&times;</button><p class="eyebrow" style="color:var(--blue);margin-top:12px">'+esc(i.k+' · '+i.s)+'</p><h2>'+esc(i.n)+'</h2><p class="loc">'+esc(i.l)+', Chennai</p><dl class="dl">';
 h+='<div><dt>Type</dt><dd>'+esc(i.k==='Plot'?'Plots':i.bt)+'</dd></div>';
 if(i.st)h+='<div><dt>Size</dt><dd>'+esc(i.st)+'</dd></div>';
 h+='<div><dt>Price</dt><dd>'+esc(i.pt)+'</dd></div><div><dt>Stage</dt><dd>'+esc(i.s)+'</dd></div></dl>';
 if(i.g&&i.g.length){h+='<div class="dw-g">'+i.g.map(function(g){return '<img src="'+g+'" alt="'+esc(i.n)+' gallery" width="320" height="240" loading="lazy">'}).join('')+'</div>'}
 if(i.hi&&i.hi.length)h+='<h3>Highlights</h3><ul class="pl">'+i.hi.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';
 if(i.lo&&i.lo.length)h+='<h3>Location</h3><ul class="pl">'+i.lo.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';
 if(i.am&&i.am.length)h+='<h3>Amenities</h3><ul class="am">'+i.am.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';
 h+='<div class="dw-act"><a class="btn btn-y" href="https://wa.me/'+D.wa+'?text='+encodeURIComponent(wm)+'" rel="noopener" data-ev="whatsapp">Ask about this on WhatsApp</a><button class="btn btn-line" type="button" data-dw-add="'+id+'">'+(SL.indexOf(id)>-1?'Remove from shortlist':'Add to shortlist')+'</button><a class="btn btn-quiet" href="'+i.u+'" rel="noopener" target="_blank">See it on the current site</a></div>';
 $('[data-dw]').innerHTML=h;openPanel(dw)}
/* helpers */
function priceMin(i){if(i.p!=null)return i.p;if(i.pp&&i.smin)return i.smin*i.pp/100000;return null}
function params(){var o={};location.search.replace(/^\?/,'').split('&').forEach(function(p){if(!p)return;var s=p.split('=');o[decodeURIComponent(s[0])]=decodeURIComponent((s[1]||'').replace(/\+/g,' '))});return o}
/* properties page */
var fb=$('[data-fbar]');
if(fb){
 var st={k:'',l:'',bhk:'',s:'',o:'',q:''},P=params();if(P.k)st.k=P.k;if(P.l)st.l=P.l;if(P.s)st.s=P.s;
 var cards=$$('[data-cards] .card'),order=cards.slice();
 function setSeg(){$$('.seg button',fb).forEach(function(b){b.setAttribute('aria-pressed',b.dataset.k===st.k)});['l','bhk','s','o'].forEach(function(f){var s=$('[data-f="'+f+'"]',fb);if(s)s.value=st[f]})}
 function apply(){
  var q=st.q.toLowerCase(),n=0,list=ITEMS.filter(function(i){
   if(st.k&&i.k!==st.k)return false;if(st.l&&i.l!==st.l)return false;if(st.s&&i.s!==st.s)return false;
   if(st.bhk&&!(i.b||[]).some(function(b){return Math.floor(b)===+st.bhk}))return false;
   if(q&&(i.n+' '+i.l+' '+i.k).toLowerCase().indexOf(q)<0)return false;return true});
  if(st.o){list.sort(function(a,b){var x=priceMin(a),y=priceMin(b);if(x==null)return 1;if(y==null)return -1;return st.o==='pa'?x-y:y-x})}
  var box=$('[data-cards]'),ids={};list.forEach(function(i){ids[i.i]=1});
  cards.forEach(function(c){c.hidden=!ids[c.dataset.id]});
  list.forEach(function(i){var c=$('[data-id="'+i.i+'"]',box);box.appendChild(c)});
  if(!st.o){order.forEach(function(c){box.appendChild(c)})}
  $('[data-count]').textContent=list.length+(list.length===1?' property':' properties');$('[data-empty]').hidden=list.length>0}
 fb.addEventListener('click',function(e){var b=e.target.closest('.seg button');if(b){st.k=b.dataset.k;setSeg();apply()}});
 fb.addEventListener('input',function(e){var f=e.target.dataset.f;if(f){st[f]=e.target.value;apply()}});
 setSeg();apply();
}
/* finder */
var ff=$('[data-ff]');
if(ff){
 var F={k:'',b:'',bhk:'',ready:false,l:[]},Q=params();
 if(Q.k)F.k=Q.k;if(Q.b)F.b=Q.b;if(Q.bhk)F.bhk=Q.bhk;
 function sync(){$$('.seg:not([data-bud]):not([data-bhk]) button',ff).forEach(function(b){b.setAttribute('aria-pressed',b.dataset.k===F.k)});$$('[data-bud] button',ff).forEach(function(b){b.setAttribute('aria-pressed',b.dataset.b===F.b)});$$('[data-bhk] button',ff).forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===F.bhk)});$('[data-bhkset]',ff).style.opacity=F.k==='Plot'?'.4':'1'}
 function fmt(l){return l>=100?'Rs '+(Math.round(l)/100).toString().replace(/\.0+$/,'')+' Cr':'Rs '+(+l.toFixed(2))+' Lakh'}
 function run(){
  var B=F.b?+F.b:null,res=[];
  ITEMS.forEach(function(i){
   if(F.k&&i.k!==F.k)return;if(F.ready&&i.s!=='Ready to move')return;if(F.l.length&&F.l.indexOf(i.l)<0)return;
   var why=[],warn=[],score=10,bhkOk=true;
   if(F.bhk&&i.k!=='Plot'){var want=+F.bhk;bhkOk=(i.b||[]).some(function(b){return F.bhk==='4'?b>=4:Math.floor(b)===want});if(!bhkOk)return;why.push((F.bhk==='4'?'4+':F.bhk)+' BHK offered');score+=20}
   var pm=priceMin(i);
   if(B!=null){
    if(pm==null||i.odd){warn.push(i.pp?'Rate per sq ft, total depends on plot size: ask the team':'Price on request: ask the team');score-=6}
    else if(pm<=B){why.push('From '+fmt(pm)+', within '+fmt(B));score+=30-Math.min(20,Math.round((B-pm)/B*20))}
    else return;
   }else if(pm!=null)why.push('From '+fmt(pm));
   if(i.s==='Ready to move'){why.push('Ready to move');score+=8}
   if(F.k&&i.k===F.k){score+=6}
   if(F.l.length&&F.l.indexOf(i.l)>-1){why.push('In '+i.l);score+=10}
   res.push({i:i,why:why,warn:warn,score:score})});
  res.sort(function(a,b){return b.score-a.score});
  var parts=[];if(F.k)parts.push(F.k.toLowerCase());if(F.bhk)parts.push(F.bhk+(F.bhk==='4'?'+':'')+' BHK');if(F.b)parts.push('up to '+fmt(+F.b));if(F.ready)parts.push('ready to move');if(F.l.length)parts.push('in '+F.l.join(', '));
  CTX=parts.join(', ');
  $('[data-rcount]').textContent=res.length?res.length+(res.length===1?' listing fits':' listings fit'):'No listing fits yet';
  $('[data-rnote]').textContent=res.length?'Best fits first. Prices are from the listing; plot totals are size x rate and indicative.':'Try a higher budget, remove the locality, or ask the team on WhatsApp: they know what is coming.';
  $('[data-results]').innerHTML=res.map(function(r){var i=r.i,ind='';
   if(i.k==='Plot'&&i.pp&&i.smin&&i.smax)ind='<p class="ind">Indicative total for '+i.smin+' to '+i.smax+' sq ft: '+fmt(i.smin*i.pp/100000)+' to '+fmt(i.smax*i.pp/100000)+'</p>';
   var pic=i.im?'<div class="card-pic"><img src="'+i.im+'" alt="'+esc(i.n+', '+i.l)+'" width="480" height="360" loading="lazy"></div>':'<div class="card-pic"><div class="ph"><b>'+esc(i.n)+'</b><span>'+esc(i.l)+'</span></div></div>';
   var meta=[i.k,i.k!=='Plot'?i.bt:'',i.st].filter(Boolean).join(' · ');
   return '<article class="rc">'+pic+'<div class="rc-b"><h3>'+esc(i.n)+'</h3><p class="loc">'+esc(i.l)+', Chennai · '+esc(meta)+'</p><p class="price">'+esc(i.pt)+'</p>'+ind+'<ul class="why">'+r.why.map(function(w){return '<li>'+esc(w)+'</li>'}).join('')+r.warn.map(function(w){return '<li class="w">'+esc(w)+'</li>'}).join('')+'</ul><div class="rc-act"><button class="add" style="position:static" type="button" data-add="'+i.i+'" aria-pressed="false"><span aria-hidden="true">+</span><i>Shortlist</i></button><button class="btn btn-line" type="button" data-open="'+i.i+'">Details</button></div></div></article>'}).join('');
  renderSL()}
 ff.addEventListener('click',function(e){var b=e.target.closest('.seg button');if(b){if(b.closest('[data-bud]'))F.b=b.dataset.b;else if(b.closest('[data-bhk]'))F.bhk=b.dataset.v;else F.k=b.dataset.k;sync();run()}
  if(e.target.closest('[data-reset]')){F={k:'',b:'',bhk:'',ready:false,l:[]};$$('input',ff).forEach(function(c){c.checked=false});sync();run()}});
 ff.addEventListener('change',function(e){var t=e.target;if(t.name==='ready')F.ready=t.checked;if(t.name==='l')F.l=$$('input[name=l]:checked',ff).map(function(c){return c.value});run()});
 sync();run();
}
renderSL();
})();
