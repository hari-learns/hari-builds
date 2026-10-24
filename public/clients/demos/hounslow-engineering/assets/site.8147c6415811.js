(function(){
var d=document,r=d.documentElement;
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduce)r.classList.add("reduce");
// menu
var m=d.querySelector(".menu"),n=d.getElementById("nav");
if(m){m.addEventListener("click",function(){var o=n.classList.toggle("open");m.setAttribute("aria-expanded",o)});
d.addEventListener("keydown",function(e){if(e.key==="Escape"&&n.classList.contains("open")){n.classList.remove("open");m.setAttribute("aria-expanded","false");m.focus()}})}
// dock
var dk=d.getElementById("dock");if(dk){dk.querySelector("button").addEventListener("click",function(){dk.classList.add("gone")})}
// reveals + counters
var rv=[].slice.call(d.querySelectorAll(".rv"));
if(!("IntersectionObserver" in window)||reduce){rv.forEach(function(x){x.classList.add("in")})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});rv.forEach(function(x){io.observe(x)})}
var cs=[].slice.call(d.querySelectorAll("[data-count]"));
if(cs.length&&"IntersectionObserver" in window&&!reduce){var co=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;co.unobserve(e.target);var el=e.target,v=parseFloat(el.dataset.count),dec=+el.dataset.dec,t0=null;
function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/1200),k=1-Math.pow(1-p,3);el.textContent=(v*k).toFixed(dec);if(p<1)requestAnimationFrame(f);else el.textContent=v.toFixed(dec)}requestAnimationFrame(f)})},{threshold:.6});cs.forEach(function(x){co.observe(x)})}
// signature tool
var f=d.getElementById("chk");
if(f){var T=JSON.parse(d.getElementById("tooldata").textContent),L=d.getElementById("resl"),S=d.getElementById("send");
function val(n){var x=parseFloat(f.elements[n].value);return isNaN(x)?null:x}
function row(c,h,t){return '<li class="'+c+'"><b>'+h+'</b>'+t+'</li>'}
function run(){var p=f.elements.proc.value,mat=f.elements.mat.value,dia=val("dia"),len=val("len"),qty=val("qty"),note=f.elements.note.value.trim(),o=[];
var known=T.materials.indexOf(mat)>-1;
if(dia===null){L.innerHTML='<li class="idle">Enter a diameter to see which processes cover your part.</li>'}
else{
if(p==="turn"||p==="unsure"){
 if(dia<=T.bar_dia_max){o.push(row("ok","CNC turning from bar","Diameter "+dia+" mm is within the 66 mm bar capacity."+(len!==null&&len>T.bar_len_max_m*1000?" Length is beyond the 3.8 m bar feed: ask about it.":"")))}
 else if(dia<=T.swing_max){o.push(row("ok","CNC turning, chucked","Diameter "+dia+" mm is within the 380 mm largest swing."+(len!==null&&len>T.turn_len_max?" Length "+len+" mm is over the 600 mm maximum turning length: ask us.":" Maximum turning length is 600 mm.")))}
 else{o.push(row("no","CNC turning","Diameter "+dia+" mm is over the 380 mm largest swing."))}
}
if(p==="grind"||p==="unsure"){o.push(row("ask","Centreless grinding","Through, plunge, bar and production grinding are offered. The size range is not published, so Hounslow confirms "+dia+" mm."))}
if(p==="pin"||p==="unsure"){o.push(row("ask","Dowel pins","Metric and Imperial, tapped and plain, precision ground. Hounslow confirms "+dia+" mm"+(len!==null?" x "+len+" mm":"")+"."))}
if(known)o.push(row("ok","Material","Hounslow machines "+mat.toLowerCase()+"."));else o.push(row("ask","Material","Not on the published list (brass, mild steel, stainless steel, aluminium, plastics, hardened steels): ask us."));
L.innerHTML=o.join("")}
var lines=["Process: "+f.elements.proc.options[f.elements.proc.selectedIndex].text,"Material: "+mat];
if(dia!==null)lines.push("Diameter: "+dia+" mm");if(len!==null)lines.push("Length: "+len+" mm");if(qty!==null)lines.push("Quantity: "+qty);if(note)lines.push("Note: "+note);
S.href="mailto:"+S.href.split("mailto:")[1].split("?")[0]+"?subject="+encodeURIComponent("Part enquiry")+"&body="+encodeURIComponent("Hello Hounslow Engineering,\n\nCould you quote this part?\n\n"+lines.join("\n")+"\n\nThank you")}
f.addEventListener("input",run);f.addEventListener("change",run);f.addEventListener("submit",function(e){e.preventDefault()});run()}
// click events (GoatCounter, if present)
d.addEventListener("click",function(e){var a=e.target.closest("[data-ev]");if(a&&window.goatcounter&&window.goatcounter.count){window.goatcounter.count({path:"click/"+a.dataset.ev,title:a.dataset.ev,event:true})}});
})();
