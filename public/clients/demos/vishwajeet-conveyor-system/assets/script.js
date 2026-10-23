(function(){
  "use strict";
  var d=document, root=d.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* dock */
  var dock=d.getElementById("dock"), dx=d.getElementById("dockx");
  try{ if(sessionStorage.getItem("vcs-dock")==="1") dock.hidden=true; }catch(e){}
  if(dx) dx.addEventListener("click",function(){ dock.hidden=true; try{sessionStorage.setItem("vcs-dock","1");}catch(e){} });

  /* drawer */
  var burger=d.getElementById("burger"), drawer=d.getElementById("drawer");
  function setMenu(o){
    drawer.classList.toggle("open",o); burger.classList.toggle("is-open",o);
    burger.setAttribute("aria-expanded",o?"true":"false"); burger.setAttribute("aria-label",o?"Close menu":"Open menu");
    drawer.setAttribute("aria-hidden",o?"false":"true");
    root.style.overflow=o?"hidden":"";
    burger.innerHTML=o?'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
  }
  if(burger){
    burger.addEventListener("click",function(){ setMenu(!drawer.classList.contains("open")); });
    d.addEventListener("keydown",function(e){ if(e.key==="Escape"&&drawer.classList.contains("open")){ setMenu(false); burger.focus(); } });
    drawer.addEventListener("click",function(e){ if(e.target.closest("a")) setMenu(false); });
    window.addEventListener("resize",function(){ if(window.innerWidth>=900&&drawer.classList.contains("open")) setMenu(false); });
  }

  /* reveals: observer plus a sweep that never strands content scrolled past */
  var rv=[].slice.call(d.querySelectorAll(".rv"));
  function show(el){ el.classList.add("in"); }
  function sweep(){ var vh=window.innerHeight||800; rv.forEach(function(el){ if(!el.classList.contains("in")&&el.getBoundingClientRect().top<vh*0.94) show(el); }); }
  if(reduce||!("IntersectionObserver" in window)){ rv.forEach(show); }
  else{
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ show(e.target); io.unobserve(e.target);} }); },{rootMargin:"0px 0px -6% 0px",threshold:.05});
    rv.forEach(function(el){ io.observe(el); });
    ["load","scroll","resize","pageshow"].forEach(function(ev){ window.addEventListener(ev,sweep,{passive:true}); });
    sweep();
  }

  /* counters: land exactly on their own counts */
  var cs=[].slice.call(d.querySelectorAll("[data-count]"));
  if(cs.length&&!reduce&&"IntersectionObserver" in window){
    var co=new IntersectionObserver(function(es){ es.forEach(function(e){
      if(!e.isIntersecting) return; co.unobserve(e.target);
      var el=e.target, to=+el.getAttribute("data-count"), t0=null;
      function step(t){ if(!t0) t0=t; var p=Math.min(1,(t-t0)/1100), v=Math.round(to*(1-Math.pow(1-p,3))); el.textContent=v; if(p<1) requestAnimationFrame(step); else el.textContent=to; }
      el.textContent=0; requestAnimationFrame(step);
    }); },{threshold:.6});
    cs.forEach(function(el){ co.observe(el); });
  }

  /* finder */
  var radios=[].slice.call(d.querySelectorAll('input[name="mv"]'));
  if(radios.length){
    var panels=[].slice.call(d.querySelectorAll(".fpanel"));
    function pick(){ var v=(radios.filter(function(r){return r.checked;})[0]||{}).value; panels.forEach(function(p){ p.hidden=p.getAttribute("data-for")!==v; }); }
    radios.forEach(function(r){ r.addEventListener("change",pick); }); pick();
  }

  /* parts filter + search */
  var grid=d.getElementById("pgrid");
  if(grid){
    var cards=[].slice.call(grid.children), chips=[].slice.call(d.querySelectorAll(".chip-b")), q=d.getElementById("psearch"), cnt=d.getElementById("pcount"), emp=d.getElementById("pempty"), g="all";
    function apply(){ var s=(q.value||"").trim().toLowerCase(), n=0;
      cards.forEach(function(c){ var ok=(g==="all"||c.getAttribute("data-g")===g)&&(!s||c.getAttribute("data-n").indexOf(s)>-1); c.hidden=!ok; if(ok){ n++; c.classList.add("in"); } });
      cnt.textContent=n+" of "+cards.length+" part families"; emp.hidden=n>0; }
    chips.forEach(function(b){ b.addEventListener("click",function(){ g=b.getAttribute("data-g"); chips.forEach(function(x){ x.setAttribute("aria-pressed",x===b?"true":"false"); }); apply(); }); });
    q.addEventListener("input",apply); apply();
  }

  /* enquiry: prefill from query, then hand to email / WhatsApp */
  var f=d.getElementById("enq");
  if(f){
    var p=new URLSearchParams(location.search);
    ["move","system","part","topic"].forEach(function(k){
      var el=f.elements[k], v=p.get(k); if(!el||!v) return;
      if(el.tagName==="SELECT"){ for(var i=0;i<el.options.length;i++){ if(el.options[i].text===v){ el.selectedIndex=i; break; } } } else el.value=v;
    });
    if(p.get("part")&&f.elements.topic&&!f.elements.topic.value){ f.elements.topic.value="Spare parts"; }
    var err=d.getElementById("err");
    function text(){
      var v=function(n){ return (f.elements[n].value||"").trim(); }, L=[];
      L.push("Name: "+v("name")); if(v("company")) L.push("Company: "+v("company")); L.push("Phone: "+v("phone")); if(v("email")) L.push("Email: "+v("email"));
      if(v("topic")) L.push("Need: "+v("topic")); if(v("move")) L.push("Moving: "+v("move")); if(v("system")) L.push("System: "+v("system")); if(v("part")) L.push("Part: "+v("part"));
      L.push("","Requirement:",v("msg")); return L.join("\n");
    }
    function ok(){ var good=["name","phone","msg"].every(function(n){ return (f.elements[n].value||"").trim(); }); err.hidden=good; if(!good){ ["name","phone","msg"].some(function(n){ if(!(f.elements[n].value||"").trim()){ f.elements[n].focus(); return true; } }); } return good; }
    d.getElementById("send-mail").addEventListener("click",function(e){ if(!ok()) return; var b=e.currentTarget;
      location.href="mailto:"+b.getAttribute("data-to")+"?subject="+encodeURIComponent(b.getAttribute("data-subject"))+"&body="+encodeURIComponent(text()); });
    d.getElementById("send-wa").addEventListener("click",function(e){ if(!ok()) return;
      window.open("https://wa.me/"+e.currentTarget.getAttribute("data-wa")+"?text="+encodeURIComponent(text()),"_blank","noopener"); });
  }
})();
