(function(){
'use strict';
var d=document,body=d.body,BASE=body.getAttribute('data-base')||'',EMAIL='sales@tesuco.com.au';
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
d.documentElement.classList.remove('no-js');

/* dock */
var dock=$('#dock');
try{if(sessionStorage.getItem('dockx')==='1'&&dock)dock.hidden=true}catch(e){}
var dx=$('#dock-x');if(dx)dx.addEventListener('click',function(){dock.hidden=true;try{sessionStorage.setItem('dockx','1')}catch(e){}});

/* nav */
var bg=$('#burger'),nav=$('#nav');
function setNav(o){nav.classList.toggle('open',o);bg.setAttribute('aria-expanded',o?'true':'false')}
if(bg)bg.addEventListener('click',function(){setNav(!nav.classList.contains('open'))});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){setNav(false);closeDrawer()}});
d.addEventListener('click',function(e){if(nav&&nav.classList.contains('open')&&!e.target.closest('#nav,#burger'))setNav(false)});

/* reveals */
var rv=$$('.rv'),reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!('IntersectionObserver' in window)||reduce){rv.forEach(function(n){n.classList.add('in')})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -4% 0px'});rv.forEach(function(n){io.observe(n)})}

/* enquiry store */
var KEY='tesuco-enq',items=[];
try{items=JSON.parse(sessionStorage.getItem(KEY)||'[]')}catch(e){items=[]}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(items))}catch(e){}}
function find(c){for(var i=0;i<items.length;i++)if(items[i].c===c)return i;return -1}
function add(c,desc){var i=find(c);if(i<0)items.push({c:c,d:desc,q:1});else items[i].q++;save();render()}
function syncButtons(){$$('.add').forEach(function(b){var on=find(b.getAttribute('data-code'))>-1;b.classList.toggle('on',on);b.textContent=on?'Added':'Add'})}
function lines(max){return items.map(function(it){return '- '+it.c+' x'+it.q+'  '+(max?it.d.replace(/\s*·\s*/g,', ').slice(0,max):it.d)})}
function mailto(){
  var em=($('#enq-email')||{}).value||'',name=($('#enq-name')||{}).value||'',ph=($('#enq-phone')||{}).value||'',note=($('#enq-note')||{}).value||'';
  var total=items.reduce(function(a,b){return a+b.q},0);
  function mk(max){return 'Hello Tesuco,\n\nPlease quote the following:\n'+lines(max).join('\n')+(note?'\n\nNotes: '+note:'')+'\n\nName: '+name+'\nEmail: '+em+'\nPhone / company: '+ph+'\n'}
  var b=mk(0);if(encodeURIComponent(b).length>1700)b=mk(48);if(encodeURIComponent(b).length>1700)b=mk(0).slice(0,0)+'Hello Tesuco,\n\nPlease quote these codes:\n'+items.map(function(i){return i.c+' x'+i.q}).join(', ')+(note?'\n\nNotes: '+note:'')+'\n\nName: '+name+'\nEmail: '+em+'\nPhone / company: '+ph+'\n';
  return 'mailto:'+EMAIL+'?subject='+encodeURIComponent('Quote enquiry: '+total+' item'+(total===1?'':'s'))+'&body='+encodeURIComponent(b);
}
function render(){
  var n=items.reduce(function(a,b){return a+b.q},0),c=$('#enq-n');if(c)c.textContent=n;
  var ul=$('#enq-list'),em=$('#enq-empty');if(!ul)return;
  ul.innerHTML='';
  items.forEach(function(it,i){
    var li=d.createElement('li');
    li.innerHTML='<div><b></b><small></small></div><div class="qty"><button type="button" aria-label="Fewer">-</button><span></span><button type="button" aria-label="More">+</button></div>';
    li.querySelector('b').textContent=it.c;li.querySelector('small').textContent=it.d.replace(/\s*·\s*/g,', ');li.querySelector('span').textContent=it.q;
    var bs=li.querySelectorAll('button');
    bs[0].onclick=function(){it.q--;if(it.q<1)items.splice(i,1);save();render()};
    bs[1].onclick=function(){it.q++;save();render()};
    ul.appendChild(li)});
  if(em)em.hidden=items.length>0;
  var m=$('#enq-mail');if(m){m.href=items.length?mailto():'mailto:'+EMAIL;m.setAttribute('aria-disabled',items.length?'false':'true')}
  syncButtons();
}
d.addEventListener('click',function(e){var b=e.target.closest('.add');if(b){add(b.getAttribute('data-code'),b.getAttribute('data-desc'))}});
['enq-name','enq-email','enq-phone','enq-note'].forEach(function(id){var el=$('#'+id);if(el)el.addEventListener('input',render)});
var dr=$('#drawer'),lastF=null;
function openDrawer(){lastF=d.activeElement;dr.hidden=false;render();var c=$('#enq-close');if(c)c.focus()}
function closeDrawer(){if(dr&&!dr.hidden){dr.hidden=true;if(lastF&&lastF.focus)lastF.focus()}}
var eo=$('#enq-open');if(eo)eo.addEventListener('click',openDrawer);
var ec=$('#enq-close');if(ec)ec.addEventListener('click',closeDrawer);
var eb=$('#drawer-bg');if(eb)eb.addEventListener('click',closeDrawer);
var cp=$('#enq-copy');if(cp)cp.addEventListener('click',function(){var t='Quote enquiry for Tesuco ('+EMAIL+')\n'+lines(0).join('\n');
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){cp.textContent='Copied'},function(){cp.textContent='Copy failed'});else cp.textContent='Copy not available';
  setTimeout(function(){cp.textContent='Copy list'},1800)});
render();

/* contact form -> mailto */
var cf=$('#cform');
if(cf)cf.addEventListener('submit',function(e){e.preventDefault();
  var b='Name: '+$('#c-name').value+'\nEmail: '+$('#c-email').value+'\nPhone: '+$('#c-phone').value+'\n\n'+$('#c-msg').value;
  location.href='mailto:'+EMAIL+'?subject='+encodeURIComponent('Website enquiry')+'&body='+encodeURIComponent(b)});

/* finder (signature tool) */
var F=$('#finder');
if(F){
  var rows=[],top='',shown=40,PAGE=40,q=$('#q'),res=$('#f-res'),cnt=$('#f-count'),more=$('#f-more'),matches=[],IMG=BASE+'/assets/img/';
  function norm(s){return s.toLowerCase().replace(/,/g,'').replace(/\s+/g,' ')}
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function hl(s,toks){var o=esc(s);toks.forEach(function(t){if(!t)return;try{o=o.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![^<]*>)','ig'),'<mark>$1</mark>')}catch(e){}});return o}
  function run(){
    var raw=q.value.trim(),toks=norm(raw).split(' ').filter(Boolean);
    matches=[];
    if(!toks.length&&!top){cnt.textContent='Type a code, a gas, a pressure or a part name, or pick a range.';res.innerHTML='';more.hidden=true;return}
    var nq=norm(raw);
    rows.forEach(function(r){
      if(top&&r[3].indexOf(top)!==0)return;
      var h=r.h,ok=true;
      for(var i=0;i<toks.length;i++){if(h.indexOf(toks[i])<0){ok=false;break}}
      if(!ok)return;
      var s=0,code=r[0].toLowerCase();
      if(code===nq)s=1000;else if(code.indexOf(nq)===0)s=500;else if(code.indexOf(nq)>-1)s=300;
      if(nq&&r.d.indexOf(nq)>-1)s+=100;
      var first=norm(r[1].split(' · ')[0]);toks.forEach(function(t){if(code.indexOf(t)>-1)s+=20;if(first.indexOf(t)>-1)s+=30});var all=toks.length>0&&toks.every(function(t){return first.indexOf(t)>-1});if(all)s+=100;s-=Math.min(r[1].length,120)/40;
      matches.push([s,r])});
    matches.sort(function(a,b){return b[0]-a[0]});
    shown=PAGE;draw(toks);
  }
  function draw(toks){
    var n=matches.length;cnt.textContent=n?(n+' product code'+(n===1?'':'s')+' found'+(n>shown?', showing '+shown:'')):'No match. Try fewer words, or email '+EMAIL+' with what you need.';
    res.innerHTML=matches.slice(0,shown).map(function(m){var r=m[1];
      var im=r[4]?'<img src="'+IMG+r[4]+'" alt="'+esc(r[0])+'" width="72" height="72" loading="lazy">':'<span class="noimg" aria-hidden="true"></span>';
      var ds=r[1].split(' · ').map(function(x){return '<span>'+hl(x,toks)+'</span>'}).join('');
      return '<li class="pr"><div class="pr-img">'+im+'</div><div class="pr-tx"><b class="code">'+hl(r[0],toks)+'</b><div class="pr-d">'+ds+'</div><small class="pr-grp"><a href="'+BASE+r[2]+'/">'+esc(r[3])+'</a></small></div><button type="button" class="add" data-code="'+esc(r[0])+'" data-desc="'+esc(r[1])+'" aria-label="Add '+esc(r[0])+' to enquiry">Add</button></li>'}).join('');
    more.hidden=matches.length<=shown;syncButtons();
  }
  fetch(F.getAttribute('data-index')).then(function(r){return r.json()}).then(function(j){
    rows=j.rows.map(function(r){r.h=norm(r[0]+' '+r[1]+' '+r[3]);r.d=norm(r[1]);return r});
    var p=new URLSearchParams(location.search);if(p.get('q'))q.value=p.get('q');
    run();
  }).catch(function(){cnt.textContent='The search could not load. Browse the product ranges or email '+EMAIL+'.'});
  var t;q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(run,120)});
  $('#q-go').addEventListener('click',run);
  q.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();run()}});
  $$('#f-chips .chip').forEach(function(c){c.addEventListener('click',function(){top=c.getAttribute('data-top');$$('#f-chips .chip').forEach(function(x){x.classList.toggle('on',x===c)});run()})});
  $$('.ex').forEach(function(b){b.addEventListener('click',function(){q.value=b.getAttribute('data-q');run();q.focus()})});
  more.addEventListener('click',function(){shown+=PAGE;draw(norm(q.value).split(' ').filter(Boolean))});
}
})();
