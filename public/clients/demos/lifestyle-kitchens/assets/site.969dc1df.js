(function(){
"use strict";
var d=document,$=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
d.documentElement.classList.remove("nojs");
/* drawer */
var dr=$("#drawer"),bg=$("#burger"),bx=$("#burger-x");
function setDr(o){if(!dr)return;dr.classList.toggle("open",o);dr.setAttribute("aria-hidden",o?"false":"true");bg&&bg.setAttribute("aria-expanded",o?"true":"false");d.body.style.overflow=o?"hidden":"";if(o){bx&&bx.focus()}else{bg&&bg.focus&&0}}
bg&&bg.addEventListener("click",function(){setDr(true)});bx&&bx.addEventListener("click",function(){setDr(false)});
$$("#drawer a").forEach(function(a){a.addEventListener("click",function(){setDr(false)})});
d.addEventListener("keydown",function(e){if(e.key==="Escape")setDr(false)});
/* dock */
var dk=$("#dock"),dx=$("#dock-x");try{if(sessionStorage.getItem("dockx"))dk&&(dk.hidden=true)}catch(e){}
dx&&dx.addEventListener("click",function(){dk.hidden=true;try{sessionStorage.setItem("dockx","1")}catch(e){}});
/* reveals */
if("IntersectionObserver" in window&&!reduce){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});$$(".rv").forEach(function(el){io.observe(el)})}else{$$(".rv").forEach(function(el){el.classList.add("in")})}
/* hero slides: their three slider photos, slow crossfade */
var hs=$$(".hero__bg figure");
if(hs.length){hs[0].classList.add("on");var cap=$(".hero__cap"),i=0;
  if(hs.length>1&&!reduce){hs.slice(1).forEach(function(f){var im=$("img",f);if(im&&im.dataset.src){im.src=im.dataset.src;if(im.dataset.srcset)im.srcset=im.dataset.srcset}});
    setInterval(function(){if(d.hidden)return;hs[i].classList.remove("on");i=(i+1)%hs.length;hs[i].classList.add("on");if(cap)cap.textContent=hs[i].getAttribute("data-cap")},6500)}}
/* project filters */
var pf=$("#pfilter");
if(pf){var cards=$$("[data-pc]");
  function applyP(){var k=($("input[name=kind]:checked",pf)||{}).value||"all",l=($("input[name=loc]:checked",pf)||{}).value||"all";var sc=$$("input[name=scope]:checked",pf).map(function(x){return x.value}),n=0;
    cards.forEach(function(c){var ok=(k==="all"||c.dataset.kind===k)&&(l==="all"||c.dataset.loc===l)&&sc.every(function(s){return(" "+c.dataset.scope+" ").indexOf(" "+s+" ")>-1});c.hidden=!ok;if(ok)n++});
    var cnt=$("#pcount");if(cnt)cnt.textContent=n+(n===1?" project":" projects");var em=$("#pempty");if(em)em.hidden=n>0}
  pf.addEventListener("change",applyP);applyP();}
/* ---------- signature tool: scope check ---------- */
var raw=$("#tool-data");if(!raw)return;
var D=JSON.parse(raw.textContent),BASE=raw.dataset.base,CT=raw.dataset.email,TEL=raw.dataset.tel;
var root=$("#tool"),mode=root.dataset.mode;/* "full" | "teaser" */
var st={s:[],m:[],l:"any"},bv={};
function readHash(){var h=location.hash.replace(/^#/,"");if(!h)return;h.split("&").forEach(function(p){var kv=p.split("=");if(kv[0]==="s")st.s=(kv[1]||"").split(",").filter(Boolean);if(kv[0]==="m")st.m=(kv[1]||"").split(",").filter(Boolean);if(kv[0]==="l")st.l=kv[1]||"any"})}
function writeHash(){if(mode!=="full")return;var h="s="+st.s.join(",")+"&m="+st.m.join(",")+"&l="+st.l;try{history.replaceState(null,"","#"+h)}catch(e){}}
function sync(){$$("input[name=s]",root).forEach(function(i){i.checked=st.s.indexOf(i.value)>-1});$$("input[name=m]",root).forEach(function(i){i.checked=st.m.indexOf(i.value)>-1});var l=$("select[name=l]",root);if(l)l.value=st.l}
function lab(list,id){for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i].label;return id}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function compute(){
  var items=st.s.map(function(x){return{k:"s",id:x}}).concat(st.m.map(function(x){return{k:"m",id:x}}));
  var res=D.projects.map(function(p){var hit=[];st.s.forEach(function(x){if(p.scope.indexOf(x)>-1)hit.push(lab(D.scopes,x))});st.m.forEach(function(x){if(p.mat.indexOf(x)>-1)hit.push(lab(D.mats,x))});
    return{p:p,hit:hit,score:hit.length+(st.l!=="any"&&p.loc===st.l?.5:0)}}).filter(function(r){return r.hit.length>0}).sort(function(a,b){return b.score-a.score||b.p.year-a.p.year});
  var cov=items.map(function(it){var list=it.k==="s"?D.scopes:D.mats,name=lab(list,it.id);var ps=D.projects.filter(function(p){return(it.k==="s"?p.scope:p.mat).indexOf(it.id)>-1});
    var alsoHit=it.k==="s"?D.also.filter(function(a){return a.scope.indexOf(it.id)>-1}):[];return{name:name,ps:ps,also:alsoHit,caps:list.filter(function(x){return x.id===it.id})[0].caps}});
  var capset=[];cov.forEach(function(c){c.caps.forEach(function(x){if(capset.indexOf(x)<0)capset.push(x)})});
  return{items:items,res:res,cov:cov,caps:capset};
}
function pr(p){return BASE+"projects/"+p.slug+"/"}
function mailBody(o){var L=[];L.push("Hello Lifestyle Kitchens & Joinery estimators,","");var pn=($("#bf-proj")||{}).value,cn=($("#bf-name")||{}).value,dw=($("#bf-dwg")||{}).value,due=($("#bf-due")||{}).value;
  L.push("We would like you to price a commercial joinery package"+(pn?" for "+pn:"")+".","");
  if(st.s.length){L.push("Scope:");st.s.forEach(function(x){L.push("- "+lab(D.scopes,x))});L.push("")}
  if(st.m.length){L.push("Finishes / materials:");st.m.forEach(function(x){L.push("- "+lab(D.mats,x))});L.push("")}
  var ln=(D.locs.filter(function(x){return x.id===st.l})[0]||{}).label;if(st.l!=="any"&&ln)L.push("Site location: "+ln);
  if(dw)L.push("Drawings available as: "+dw);if(due)L.push("Tender / price due: "+due);
  L.push("","Regards,",cn||"[your name and company]");return L.join("\n")}
function render(){
  var c=compute(),n=c.items.length,out=$("#res",root);if(!out)return;
  var cnt=$("#tool-n",root);if(cnt)cnt.textContent=n;
  if(mode==="teaser"){var link=$("#tool-go",root);var h="#s="+st.s.join(",")+"&m="+st.m.join(",")+"&l="+st.l;if(link)link.href=link.dataset.href+h;
    out.innerHTML=n?'<p><b class="tt">'+c.res.length+'</b> of the '+D.projects.length+' published commercial projects include at least one of your '+n+' item'+(n>1?"s":"")+".</p>":'<p class="hint">Tick what is in your package. Nothing is sent anywhere.</p>';return}
  var h="";
  if(!n){out.innerHTML='<div class="empty">Tick the items in your package on the left. You will see which of the real projects on the current Lifestyle Kitchens site include them, which in-house shops are involved, and you can send the scope to the estimators in one tap.</div>';return}
  var covered=c.cov.filter(function(x){return x.ps.length}).length;
  h+='<div class="tool__score"><b>'+c.res.length+'</b><span>of the '+D.projects.length+' published commercial projects include '+(n>1?"at least one of your "+n+" items":"your item")+'. '+covered+' of your '+n+' items have a published project page'+(n-covered?"; for the other "+(n-covered)+" ask the estimators for references.":".")+'</span></div>';
  h+='<h3 class="h3">Matching projects</h3><div class="mgrid">'+c.res.slice(0,8).map(function(r){var p=r.p;return'<a class="mcard" href="'+pr(p)+'"><img src="'+p.img+'" alt="" width="96" height="96" loading="lazy"><div><b>'+esc(p.name)+'</b><small>'+esc(p.city)+" · "+p.year+'</small><span class="hit">'+esc(r.hit.join(" · "))+'</span></div></a>'}).join("")+'</div>';
  if(!c.res.length)h+='<div class="empty">No published project page includes these items yet.</div>';
  h+='<h3 class="h3">Item by item</h3><ul class="cov">'+c.cov.map(function(x){var a=x.ps.length?'<span class="ok">'+x.ps.length+(x.ps.length>1?" projects: ":" project: ")+x.ps.slice(0,4).map(function(p){return'<a href="'+pr(p)+'">'+esc(p.name)+'</a>'}).join(", ")+(x.ps.length>4?' <details class="more"><summary>+'+(x.ps.length-4)+' more</summary>'+x.ps.slice(4).map(function(p){return'<a href="'+pr(p)+'">'+esc(p.name)+'</a>'}).join(", ")+'</details>':"")+'</span>':'<span class="no">No published project page. Named on the supply list.</span>';
    var al=x.also.length?'<span class="no">Also on their client list: '+x.also.map(function(y){return esc(y.name.replace(/^(Joinery|Kiosk|Shop) fitout for /,""))}).join("; ")+'</span>':"";return'<li><b>'+esc(x.name)+'</b>'+a+al+'</li>'}).join("")+'</ul>';
  h+='<h3 class="h3">In-house shops likely involved</h3><ul class="shops">'+c.caps.map(function(k){return'<li><b>'+esc(D.caps[k].name)+'</b><span>'+esc(D.caps[k].short)+'</span></li>'}).join("")+'</ul><p class="hint">Mapping of items to shops is indicative, from the shops the company lists on its About and Commercial pages. Confirm with the estimators.</p>';
  h+='<div class="brief"><h3 class="h3">Send this scope to the estimators</h3><p class="hint" style="margin-top:0">Opens an email to '+esc(CT)+' with your ticked scope already written. Attach your drawings (PDF or DWG) to that email.</p>'+
   '<div class="field"><label for="bf-proj">Project name</label><input id="bf-proj" type="text" autocomplete="off" placeholder="e.g. Level 4 office fitout"></div>'+
   '<div class="field"><label for="bf-name">Your name and company</label><input id="bf-name" type="text" autocomplete="name"></div>'+
   '<div class="field"><label for="bf-dwg">Drawings available as</label><select id="bf-dwg"><option value="">Choose</option><option>PDF</option><option>DWG / DXF</option><option>Not yet issued</option></select></div>'+
   '<div class="field"><label for="bf-due">Price due date</label><input id="bf-due" type="text" autocomplete="off" placeholder="e.g. 20 November"></div>'+
   '<pre id="bf-pre" aria-label="Email preview"></pre><div class="btn-row" style="margin-top:16px"><a class="btn" id="bf-mail" href="#">Email the package</a><a class="btn btn--ghost" href="'+TEL+'">Call (02) 6284 4111</a><button type="button" class="btn btn--ghost" id="bf-copy">Copy scope</button></div><p class="hint" id="bf-msg" role="status"></p></div>';
  out.innerHTML=h;
  var prev=$("#bf-pre"),ml=$("#bf-mail");function upd(){var b=mailBody(c);prev.textContent=b;var pn=$("#bf-proj").value;ml.href="mailto:"+CT+"?subject="+encodeURIComponent("Joinery package enquiry"+(pn?": "+pn:""))+"&body="+encodeURIComponent(b)}
  $$("#bf-proj,#bf-name,#bf-dwg,#bf-due").forEach(function(i){if(bv[i.id])i.value=bv[i.id];i.addEventListener("input",function(){bv[i.id]=i.value;upd()});i.addEventListener("change",function(){bv[i.id]=i.value;upd()})});upd();
  $("#bf-copy").addEventListener("click",function(){var t=prev.textContent,m=$("#bf-msg");if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){m.textContent="Scope copied."},function(){m.textContent="Select the preview text above to copy it."})}else m.textContent="Select the preview text above to copy it."});
}
function onChange(e){var t=e.target;if(t.name==="s"||t.name==="m"){var a=t.name==="s"?st.s:st.m,i=a.indexOf(t.value);if(t.checked&&i<0)a.push(t.value);if(!t.checked&&i>-1)a.splice(i,1)}if(t.name==="l")st.l=t.value;writeHash();render()}
readHash();sync();root.addEventListener("change",onChange);
$$("[data-proj]",root).forEach(function(bn){bn.addEventListener("click",function(){var p=D.projects.filter(function(x){return x.slug===bn.dataset.proj})[0];if(!p)return;st.s=p.scope.slice();st.m=p.mat.slice();st.l=(p.loc==="canberra"||p.loc==="sydney")?p.loc:"any";sync();writeHash();render();if(window.innerWidth<1000){var r=$("#res",root);r&&r.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"})}})});
var clr=$("#tool-clear",root);clr&&clr.addEventListener("click",function(){st.s=[];st.m=[];st.l="any";sync();writeHash();render()});
render();
})();
