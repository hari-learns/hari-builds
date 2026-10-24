(function(){
var d=document,rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
/* nav drawer */
var b=d.querySelector(".burger"),n=d.getElementById("nav");
if(b&&n){b.addEventListener("click",function(){var o=n.classList.toggle("open");b.setAttribute("aria-expanded",o)});n.addEventListener("click",function(e){if(e.target.closest("a")){n.classList.remove("open");b.setAttribute("aria-expanded","false")}});d.addEventListener("keydown",function(e){if(e.key==="Escape"){n.classList.remove("open");b.setAttribute("aria-expanded","false")}})}
/* dock */
var dk=d.querySelector(".dock");if(dk){dk.querySelector("button").addEventListener("click",function(){dk.hidden=true})}
/* reveal */
var rv=[].slice.call(d.querySelectorAll(".rv"));
if(rm||!("IntersectionObserver"in window)){rv.forEach(function(e){e.classList.add("in")})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.05});
rv.forEach(function(e,i){e.style.setProperty("--d",(i%4)*0.06+"s");io.observe(e)})}
/* counters (real figures from job sheets) */
if(!rm&&"IntersectionObserver"in window){d.querySelectorAll(".num").forEach(function(el){var f=el.dataset.final,m=f.match(/^([\d.]+)(.*)$/);if(!m||f==="1997")return;var t=parseFloat(m[1]),dec=(m[1].split(".")[1]||"").length,s=m[2];
var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();var t0=performance.now();(function tick(now){var p=Math.min(1,(now-t0)/1100),e=1-Math.pow(1-p,3);el.textContent=(t*e).toFixed(dec)+s;if(p<1)requestAnimationFrame(tick);else el.textContent=f})(t0)},{threshold:.6});o.observe(el)})}
/* project finder */
d.querySelectorAll(".finder").forEach(function(F){
var P=JSON.parse(F.dataset.projects),L=JSON.parse(F.dataset.labels),mail=F.dataset.email;
var cards=[].slice.call(F.querySelectorAll(".pc")),grid=F.querySelector(".pgrid"),sum=F.querySelector(".fsum"),none=F.querySelector(".fnone"),sel=F.querySelector("select"),boxes=[].slice.call(F.querySelectorAll("input[type=checkbox]"));
var order=cards.slice();
function run(){var sv=boxes.filter(function(x){return x.checked}).map(function(x){return x.value}),tn=sel.value;
var res=cards.map(function(c){var p=P[c.dataset.key],hit=sv.filter(function(s){return p.services.indexOf(s)>-1}),ok=(!sv.length||hit.length>0)&&(!tn||p.town===tn);return{c:c,p:p,hit:hit,ok:ok}});
res.sort(function(a,b){return b.hit.length-a.hit.length||order.indexOf(a.c)-order.indexOf(b.c)});
var shown=0;res.forEach(function(r){grid.appendChild(r.c);r.c.hidden=!r.ok;r.c.classList.add("in");if(r.ok)shown++;
var h=r.c.querySelector(".pc-hit");if(r.ok&&sv.length){h.hidden=false;h.textContent="Matches "+r.hit.length+" of "+sv.length+": "+r.hit.map(function(s){return L[s]}).join(", ")}else h.hidden=true;
var body="Hello EPL,\n\nI have a job like "+r.p.name+".\n"+(sv.length?"It involves: "+sv.map(function(s){return L[s]}).join(", ")+".\n":"")+(tn?"Location: "+tn+".\n":"")+"\nMy name and phone:\n";
r.c.querySelector(".ask").href="mailto:"+mail+"?subject="+encodeURIComponent("Enquiry: a job like "+r.p.name)+"&body="+encodeURIComponent(body)});
var parts=[];if(sv.length)parts.push(sv.map(function(s){return L[s]}).join(" + "));if(tn)parts.push("in "+tn);
sum.textContent=shown+" of "+cards.length+" projects"+(parts.length?" match "+parts.join(" "):"");
none.hidden=shown>0;if(!shown){var body2="Hello EPL,\n\nI have a job that involves: "+(sv.map(function(s){return L[s]}).join(", ")||"(please describe)")+(tn?" in "+tn:"")+".\n\nMy name and phone:\n";none.querySelector(".mail").href="mailto:"+mail+"?subject="+encodeURIComponent("Enquiry: new job")+"&body="+encodeURIComponent(body2)}}
boxes.forEach(function(x){x.addEventListener("change",run)});sel.addEventListener("change",run);
F.querySelector(".clear").addEventListener("click",function(){boxes.forEach(function(x){x.checked=false});sel.value="";run()});
var q=new URLSearchParams(location.search).get("service");if(q){boxes.forEach(function(x){if(x.value===q)x.checked=true})}
run()});
/* contact form -> mailto */
d.querySelectorAll(".cform").forEach(function(f){f.addEventListener("submit",function(e){e.preventDefault();var g=function(k){return f.elements[k].value.trim()};
var body="Name: "+g("n")+"\nPhone: "+g("p")+"\nJob location: "+g("w")+"\n\n"+g("m");location.href="mailto:"+f.dataset.email+"?subject="+encodeURIComponent("Website enquiry from "+(g("n")||"a visitor"))+"&body="+encodeURIComponent(body)})});
})();
