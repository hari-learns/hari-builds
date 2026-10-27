(function(){
'use strict';
var d=document,$=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* drawer */
var dr=$('#drawer'),bg=$('#burger'),bx=$('#burger-x');
function openD(o){if(!dr)return;dr.classList.toggle('is-open',o);dr.setAttribute('aria-hidden',o?'false':'true');if(bg)bg.setAttribute('aria-expanded',o?'true':'false');d.body.style.overflow=o?'hidden':'';if(o&&bx)bx.focus();else if(bg&&!o)bg.focus&&0}
if(bg)bg.addEventListener('click',function(){openD(true)});
if(bx)bx.addEventListener('click',function(){openD(false)});
if(dr)$$('a',dr).forEach(function(a){a.addEventListener('click',function(){openD(false)})});
d.addEventListener('keydown',function(e){if(e.key==='Escape')openD(false)});
/* dock */
var dock=$('#dock'),dx=$('#dock-x');
try{if(sessionStorage.getItem('dockx')&&dock)dock.hidden=true}catch(e){}
if(dx)dx.addEventListener('click',function(){dock.hidden=true;try{sessionStorage.setItem('dockx','1')}catch(e){}});
/* reveal */
var rv=$$('.rv');
if('IntersectionObserver' in window&&!reduce){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('is-in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.05});rv.forEach(function(el){io.observe(el)})}else{rv.forEach(function(el){el.classList.add('is-in')})}
/* counters */
function fmt(n){return String(n)}
var cs=$$('[data-count]');
if(cs.length&&'IntersectionObserver' in window&&!reduce){var co=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var el=en.target,to=+el.getAttribute('data-count'),suf=el.getAttribute('data-suffix')||'',t0=null;co.unobserve(el);
function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1100),v=Math.round(to*(1-Math.pow(1-k,3)));el.textContent=fmt(v)+suf;if(k<1)requestAnimationFrame(step)}requestAnimationFrame(step)})},{threshold:.6});cs.forEach(function(el){co.observe(el)})}
/* vimeo click-to-load */
d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.vid[data-vimeo]');if(!b)return;e.preventDefault();var id=b.getAttribute('data-vimeo');var f=d.createElement('iframe');f.src='https://player.vimeo.com/video/'+id+'?autoplay=1&dnt=1';f.allow='autoplay; fullscreen; picture-in-picture';f.setAttribute('allowfullscreen','');f.title=b.getAttribute('aria-label')||'Video';f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');b.innerHTML='';b.appendChild(f);b.removeAttribute('data-vimeo');b.style.cursor='default';b.classList.add('is-playing')});
/* tool data */
var td=$('#tooldata'),TD=null;try{if(td)TD=JSON.parse(td.textContent)}catch(e){}
function fit(m,W,T){var best=null;m.v.forEach(function(v,i){var ok=v.p.some(function(p){return W<=p[0]&&T<=p[1]});if(ok&&(!best||v.b<best.v.b||(v.b===best.v.b&&i<best.i)))best={m:m,v:v,i:i}});return best}
function all(W,T,kind){if(!TD)return[];var r=[];TD.m.forEach(function(m){if(kind&&kind!=='all'&&m.k!==kind)return;var f=fit(m,W,T);if(f)r.push(f)});r.sort(function(a,b){return a.v.b-b.v.b||a.m.n.localeCompare(b.m.n)});return r}
function T(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k]})}
/* mini form on home */
var mo=$('#miniout'),hw=$('#hw'),ht=$('#ht');
function mini(){if(!mo||!TD)return;var W=+hw.value,Tt=+ht.value;if(!W||!Tt){mo.textContent='';return}var n=all(W,Tt).length,u=TD.ui;mo.textContent=n===0?T(u.res_0,{w:W,t:Tt}):(n===1?T(u.res_1,{w:W,t:Tt}):T(u.res_n,{n:n,w:W,t:Tt}))}
if(hw&&ht){hw.addEventListener('input',mini);ht.addEventListener('input',mini);mini()}
/* tool */
var tool=$('#tool');
if(tool&&TD){
 var tw=$('#tw'),tt=$('#tt'),out=$('#toolout'),form=$('#toolform'),kind='all',expanded=false,lang=tool.getAttribute('data-lang'),u=TD.ui,q=new URLSearchParams(location.search);
 if(+q.get('w'))tw.value=+q.get('w');if(+q.get('t'))tt.value=+q.get('t');
 var NS='http://www.w3.org/2000/svg';
 function chart(f,W,Tt){var pairs=f.v.p,mw=Math.max(W,Math.max.apply(null,pairs.map(function(p){return p[0]}))),mh=Math.max(Tt,Math.max.apply(null,pairs.map(function(p){return p[1]})));
  var X=Math.ceil(mw*1.08/50)*50,Y=Math.ceil(mh*1.25/25)*25,vw=360,vh=Math.max(120,Math.min(220,vw*Y/X)),ml=34,mb=22,pw=vw-ml-8,ph=vh-mb-8,sx=pw/X,sy=ph/Y,s='';
  var st=X<=500?50:100;for(var x=0;x<=X;x+=st)s+='<line class="gl" x1="'+(ml+x*sx).toFixed(1)+'" y1="8" x2="'+(ml+x*sx).toFixed(1)+'" y2="'+(8+ph)+'"/><text class="ax" x="'+(ml+x*sx).toFixed(1)+'" y="'+(vh-6)+'" text-anchor="middle">'+x+'</text>';
  var sy2=Y<=200?25:50;for(var y=0;y<=Y;y+=sy2)s+='<line class="gl" x1="'+ml+'" y1="'+(8+ph-y*sy).toFixed(1)+'" x2="'+(ml+pw)+'" y2="'+(8+ph-y*sy).toFixed(1)+'"/><text class="ax" x="'+(ml-4)+'" y="'+(8+ph-y*sy+3).toFixed(1)+'" text-anchor="end">'+y+'</text>';
  var sorted=pairs.slice().sort(function(a,b){return b[1]-a[1]});
  sorted.forEach(function(p,i){s+='<rect class="r'+(i%2+1)+'" x="'+ml+'" y="'+(8+ph-p[1]*sy).toFixed(1)+'" width="'+(p[0]*sx).toFixed(1)+'" height="'+(p[1]*sy).toFixed(1)+'"/>'});
  s+='<rect class="you" x="'+ml+'" y="'+(8+ph-Tt*sy).toFixed(1)+'" width="'+(W*sx).toFixed(1)+'" height="'+(Tt*sy).toFixed(1)+'"/>';
  sorted.forEach(function(p,i){s+='<text class="lb r'+(i%2+1)+'t" x="'+(ml+ (i?p[0]*sx-6:6))+'" y="'+(i?(8+ph-p[1]*sy-4):(8+ph-p[1]*sy-4)).toFixed(1)+'" '+(i?'text-anchor="end"':'')+'>'+p[0]+' × '+p[1]+'</text>'});
  return '<svg class="chart" viewBox="0 0 '+vw+' '+vh.toFixed(0)+'" role="img" aria-label="'+f.m.n+': '+pairs.map(function(p){return p[0]+' × '+p[1]}).join(', ')+' mm">'+s+'</svg>'}
 function render(){var W=Math.round(+tw.value),Tt=Math.round(+tt.value);
  if(!W||!Tt||W<1||Tt<1){out.innerHTML='<p class="tool__hint">'+u.ph_hint+'</p>';return}
  var r=all(W,Tt,kind),n=r.length,sum=n===0?T(u.res_0,{w:W,t:Tt}):(n===1?T(u.res_1,{w:W,t:Tt}):T(u.res_n,{n:n,w:W,t:Tt}));
  var h='<p class="tool__sum">'+sum+'</p>';
  if(n===0)h+='<p class="tool__hint">'+u.res_0b+'</p>';
  var LIM=6,show=expanded?n:Math.min(LIM,n);
  if(n>0)h+='<p class="tool__hint">'+u.order+'</p>';
  h+='<div class="rgrid">'+r.slice(0,show).map(function(f){return '<article class="rcard"><h3>'+f.m.n+'</h3><div class="rcard__m"><span>'+f.m.f+'</span><span>'+u.blade+' <b>Ø'+f.v.b+'</b></span><span>'+u.fits+' <b>'+f.v.p.map(function(p){return p[0]+' × '+p[1]}).join(' <i>oppure</i> ')+' mm</b></span></div><div class="rcard__m"><span>'+f.v.l+'</span></div>'+chart(f,W,Tt)+'<a class="lnk" href="'+f.m.u+'">'+u.open+' →</a></article>'}).join('')+'</div>'+(n>LIM?'<p><button type="button" class="btn btn--ghost" id="tmore">'+(expanded?u.less:T(u.more,{n:n}))+'</button></p>':'');
  var names=r.map(function(f){return f.m.n}).join(', ')||'-';
  var subj=encodeURIComponent(T(u.subj,{w:W,t:Tt})),body=T(u.body,{w:W,t:Tt,m:names}).replace(/ /g,'%20');
  var wam=encodeURIComponent(T(u.subj,{w:W,t:Tt})+' - '+names);
  h+='<div class="tool__act"><div class="btn-row"><a class="btn" href="mailto:'+tool.getAttribute('data-mail')+'?subject='+subj+'&body='+body+'">'+u.send+'</a><a class="btn btn--ghost" rel="noopener" href="https://api.whatsapp.com/send?phone='+tool.getAttribute('data-wa')+'&text='+wam+'">'+u.wa+'</a></div><p class="tool__hint">'+u.hint+'</p></div>';
  out.innerHTML=h;var tm=$('#tmore');if(tm)tm.addEventListener('click',function(){expanded=!expanded;render()});
  try{var nu=new URL(location.href);nu.searchParams.set('w',W);nu.searchParams.set('t',Tt);history.replaceState(null,'',nu)}catch(e){}}
 form.addEventListener('submit',function(e){e.preventDefault();render()});
 [tw,tt].forEach(function(i){i.addEventListener('input',render)});
 $$('.chip[data-w]',tool).forEach(function(c){c.addEventListener('click',function(){tw.value=c.getAttribute('data-w');tt.value=c.getAttribute('data-t');render()})});
 $$('.chip--k',tool).forEach(function(c){c.addEventListener('click',function(){kind=c.getAttribute('data-k');$$('.chip--k',tool).forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});render()})});
 render();
}
/* quote form -> mailto */
var qf=$('#quote');
if(qf){var qs=new URLSearchParams(location.search),en=qf.getAttribute('data-lang')==='en';
 var mval=qs.get('modello')||qs.get('model');if(mval&&$('#q-m'))$('#q-m').value=mval;
 if(+qs.get('w')&&$('#q-w'))$('#q-w').value=+qs.get('w');if(+qs.get('t')&&$('#q-t'))$('#q-t').value=+qs.get('t');
 qf.addEventListener('submit',function(e){e.preventDefault();var f=qf.elements,miss=false;['azienda','nome','email','nazione'].forEach(function(k){var el=f[k];if(!el.value.trim()){miss=true;el.style.borderColor='var(--red)'}else el.style.borderColor=''});if(miss){var fi=qf.querySelector('input[style*="border-color"]');if(fi)fi.focus();return}
  var L=en?{az:'Company',nm:'Name',em:'Email',tl:'Phone',na:'Country',lu:'Final destination',w:'Width',t:'Thickness',g:'Length',mx:'max',mn:'min',lg:'Wood species',m3:'Volume (m3/year)',fo:'Board shape',mo:'Model',no:'Notes',sub:'Quote request',hi:'Hello,'}:{az:'Azienda',nm:'Nome',em:'Email',tl:'Telefono',na:'Nazione',lu:'Destinazione finale',w:'Larghezza',t:'Spessore',g:'Lunghezza',mx:'max',mn:'min',lg:'Tipo di legno',m3:'Quantità (m3/anno)',fo:'Forma della tavola',mo:'Modello',no:'Note',sub:'Richiesta preventivo',hi:'Buongiorno,'};
  var lines=[L.hi,'',L.az+': '+f.azienda.value,L.nm+': '+f.nome.value,L.em+': '+f.email.value,L.tl+': '+f.tel.value,L.na+': '+f.nazione.value,L.lu+': '+f.luogo.value,'',L.w+' '+L.mx+'/'+L.mn+' (mm): '+f.lmax.value+' / '+f.lmin.value,L.t+' '+L.mx+'/'+L.mn+' (mm): '+f.smax.value+' / '+f.smin.value,L.g+' '+L.mx+'/'+L.mn+' (mm): '+f.gmax.value+' / '+f.gmin.value,L.lg+': '+f.legno.value,L.m3+': '+f.m3.value,(f.forma?L.fo+': '+f.forma.value:''),L.mo+': '+f.modello.value,L.no+': '+f.note.value];
  location.href='mailto:'+qf.getAttribute('data-mail')+'?subject='+encodeURIComponent(L.sub+' - '+f.azienda.value)+'&body='+encodeURIComponent(lines.join('\n'))});
 if(location.hash==='#preventivo'||location.hash==='#quote'){setTimeout(function(){qf.scrollIntoView&&qf.scrollIntoView({block:'start'})},50)}}
})();
