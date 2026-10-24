(function(){
var d=document,de=d.documentElement;
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduce)de.classList.add("reduce");
/* menu */
var b=d.querySelector(".burger"),n=d.getElementById("nav");
if(b&&n){b.addEventListener("click",function(){var o=n.classList.toggle("open");b.setAttribute("aria-expanded",o);b.setAttribute("aria-label",o?"Close menu":"Open menu");d.body.style.overflow=o?"hidden":""});
n.addEventListener("click",function(e){if(e.target.closest("a")){n.classList.remove("open");b.setAttribute("aria-expanded","false");d.body.style.overflow=""}});
d.addEventListener("keydown",function(e){if(e.key==="Escape"&&n.classList.contains("open")){n.classList.remove("open");b.setAttribute("aria-expanded","false");d.body.style.overflow="";b.focus()}})}
/* dock */
var dk=d.getElementById("dock"),dx=d.getElementById("dockx");
try{if(sessionStorage.getItem("dock")==="x")dk.hidden=true}catch(e){}
if(dx)dx.addEventListener("click",function(){dk.hidden=true;try{sessionStorage.setItem("dock","x")}catch(e){}});
/* reveals */
var rv=[].slice.call(d.querySelectorAll(".rv"));
if(!reduce&&"IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.05});rv.forEach(function(el){io.observe(el)})}else rv.forEach(function(el){el.classList.add("in")});
/* hero parallax (<=6%) */
var hb=d.querySelector(".hero img.bg");
if(hb&&!reduce){var tk=false;addEventListener("scroll",function(){if(tk)return;tk=true;requestAnimationFrame(function(){var y=Math.min(scrollY,innerHeight);hb.style.translate="0 "+(y*.06).toFixed(1)+"px";tk=false})},{passive:true})}
/* click events (GoatCounter if present) */
d.addEventListener("click",function(e){var a=e.target.closest("[data-ev]");if(!a)return;var ev=a.getAttribute("data-ev");if(window.goatcounter&&goatcounter.count){try{goatcounter.count({path:"click-"+ev,title:ev,event:true})}catch(x){}}});
/* quote form -> mailto */
var mf=d.querySelector("[data-mailform]");
if(mf)mf.addEventListener("submit",function(e){e.preventDefault();var g=function(k){return mf.elements[k].value.trim()};
var body="Name: "+g("name")+"\nCompany: "+g("company")+"\nPhone: "+g("phone")+"\n\n"+g("msg");
location.href="mailto:"+mf.dataset.to+"?subject="+encodeURIComponent("Quote request from "+(g("company")||g("name")||"website"))+"&body="+encodeURIComponent(body)});
/* signature tool: which material for my job */
d.querySelectorAll("[data-finder]").forEach(function(f){
var D=JSON.parse(f.querySelector(".fdata").textContent),res=f.querySelector(".res");
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function run(){
var picks=[].slice.call(f.querySelectorAll('input[name=need]:checked')).map(function(i){return D.needs[+i.value]});
var how=[].slice.call(f.querySelectorAll('input[name=how]:checked')).map(function(i){return i.value});
var ind=f.querySelector('select[name=industry]').value;
if(!picks.length){res.innerHTML='<p class="empty">Pick at least one need above and your starting point appears here.</p>';return}
var fam={};picks.forEach(function(p){(fam[p[1]]=fam[p[1]]||[]).push(p[0])});
var cards=Object.keys(fam).map(function(k){var m=D.fam[k]||D.svc[k];
return '<li><b>'+esc(m.name)+'</b><p>'+esc(m.fact)+'</p><p style="color:#fff">For: '+esc(fam[k].join(", "))+'</p><a href="'+m.url+'">See the page →</a></li>'}).join("");
var hw=(how.length?how:["workshop"]).map(function(k){return '<li><b>'+esc(D.how[k][0])+'</b><p>'+esc(D.how[k][1])+'</p></li>'}).join("");
var names=Object.keys(fam).map(function(k){return(D.fam[k]||D.svc[k]).name});
var body="Hello Consolidated,\n\nI'd like a quote.\n\nThe job needs: "+picks.map(function(p){return p[0]}).join(", ")+"\nIndustry: "+(ind||"not given")+"\nDelivery: "+(how.length?how.map(function(k){return D.how[k][0]}).join("; "):"not decided")+"\nStarting point: "+names.join(", ")+"\n\nMy name:\nCompany:\nPhone:\nDescription of the part/job:\n";
var href="mailto:"+D.to+"?subject="+encodeURIComponent("Quote request: "+names.join(" / "))+"&body="+encodeURIComponent(body);
res.innerHTML='<h3>Where your job points</h3><ul class="rlist">'+cards+'</ul><h3>How we can deliver it</h3><ul class="rlist">'+hw+'</ul><p><a class="btn" data-ev="finder-send" href="'+href+'">Send this to our sales team</a></p><p class="note">Indicative: this points to a starting family and service from our published pages. The Consolidated team confirms the exact grade with you.</p>'}
f.addEventListener("change",run);run()})
})();
