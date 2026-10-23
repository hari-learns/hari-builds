(function(){
  var d=document,root=d.documentElement,rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s,c){return (c||d).querySelector(s)}function $$(s,c){return [].slice.call((c||d).querySelectorAll(s))}
  root.classList.add("is-ready");
  /* reveal: IntersectionObserver plus a sweep that also reveals anything already scrolled past */
  var els=$$(".rv,.bars,[data-hero]");
  function on(el){el.classList.add("is-in")}
  function sweep(){var vh=innerHeight;els.forEach(function(el){if(el.getBoundingClientRect().top<vh*0.96)on(el)})}
  if(rm){els.forEach(on)}else{
    if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){on(x.target);io.unobserve(x.target)}})},{rootMargin:"0px 0px -8% 0px"});els.forEach(function(el){io.observe(el)})}
    ["load","scroll","resize","pageshow"].forEach(function(ev){addEventListener(ev,sweep,{passive:true})});sweep();
  }
  /* drawer */
  var dr=$("#drawer"),b=$("#burger"),bx=$("#burger-x");
  function openD(o){dr.classList.toggle("is-open",o);b.setAttribute("aria-expanded",o);root.style.overflow=o?"hidden":"";if(o)bx.focus();else b.focus()}
  if(dr&&b){b.addEventListener("click",function(){openD(true)});bx.addEventListener("click",function(){openD(false)});$$("a",dr).forEach(function(a){a.addEventListener("click",function(){openD(false)})});addEventListener("keydown",function(e){if(e.key==="Escape"&&dr.classList.contains("is-open"))openD(false)});}
  /* dock */
  var dk=$("#dock"),dx=$("#dock-x");
  try{if(sessionStorage.getItem("dock")==="x"&&dk)dk.hidden=true}catch(e){}
  if(dx)dx.addEventListener("click",function(){dk.hidden=true;try{sessionStorage.setItem("dock","x")}catch(e){}});
  /* weight ruler */
  $$("[data-ruler]").forEach(function(r){
    var D=JSON.parse($("[data-rdata]",r).textContent),n=$("#rl-n",r),u=$("#rl-u",r),rg=$("#rl-r",r),ms=$$("[data-m]",r),op=$("[data-o=pdc]",r),os=$("[data-o=sand]",r),cta=$("[data-cta]",r);
    var lo=Math.log10(D.min),hi=Math.log10(D.max),K={g:.001,kg:1,t:1000};
    function kg(){var v=parseFloat(n.value);return isNaN(v)||v<=0?null:v*K[u.value]}
    function fmt(x){if(x<1)return +(x*1000).toPrecision(3)+" g";if(x>=1000)return +(x/1000).toPrecision(3)+" t";return +x.toPrecision(3)+" kg"}
    function upd(from){
      var w=kg();
      if(w===null){op.textContent=D.ui.na;os.textContent="";op.classList.remove("is-in");os.classList.remove("is-in");return}
      var p=(Math.log10(Math.min(Math.max(w,D.min),D.max))-lo)/(hi-lo);ms.forEach(function(m){m.style.left=(p*100)+"%"});if(from!=="r")rg.value=Math.round(p*1000);
      var a=w>=D.pdc[0]&&w<=D.pdc[1],s=w<=D.sand[1];
      op.innerHTML="<b>"+D.ui.pdc+":</b> "+(a?D.ui.in:D.ui.out);op.classList.toggle("is-in",a);
      os.innerHTML="<b>"+D.ui.sand+":</b> "+(s?D.ui.sand_in:D.ui.out);os.classList.toggle("is-in",s);
      cta.href=D.contact+"?weight="+encodeURIComponent(+w.toPrecision(4))+"&unit=kg#quote";
    }
    n.addEventListener("input",function(){upd("n")});u.addEventListener("change",function(){upd("u")});
    rg.addEventListener("input",function(){var v=Math.pow(10,lo+(hi-lo)*rg.value/1000);var x=v/K[u.value];n.value=+x.toPrecision(3);upd("r")});
    upd("n");
  });
  /* quote form */
  var q=$("#quote"),qd=$("#q-data");
  if(q&&qd){
    var Q=JSON.parse(qd.textContent);
    try{var sp=new URLSearchParams(location.search);if(sp.get("weight")){$("#weight").value=sp.get("weight")+" kg"}}catch(e){}
    function body(){var L=Q.labels,out=[];Object.keys(L).forEach(function(k){var el=d.getElementById(k);if(el&&el.value.trim())out.push(L[k]+": "+el.value.trim())});return out.join("\n")}
    q.addEventListener("submit",function(e){e.preventDefault();location.href="mailto:"+Q.to+"?subject="+encodeURIComponent(Q.subject)+"&body="+encodeURIComponent(body())});
    var cp=$("#q-copy");
    if(cp)cp.addEventListener("click",function(){var t=body();var done=function(){var o=cp.textContent;cp.textContent=cp.dataset.done;setTimeout(function(){cp.textContent=o},1800)};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});});
  }
})();
