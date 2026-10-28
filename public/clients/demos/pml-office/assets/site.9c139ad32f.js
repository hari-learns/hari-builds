(function(){
"use strict";
var d=document,w=window;
var reduce=w.matchMedia&&w.matchMedia("(prefers-reduced-motion: reduce)").matches;
function $(s,r){return (r||d).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}
function st(k,v){try{if(v===undefined)return w.sessionStorage.getItem(k);w.sessionStorage.setItem(k,v)}catch(e){return null}}
function eur(n){return "€ "+Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".")}

/* menu drawer */
(function(){
  var b=$("#burger"),x=$("#burger-x"),dr=$("#drawer");if(!b||!dr)return;
  function set(o){dr.classList.toggle("is-open",o);dr.setAttribute("aria-hidden",o?"false":"true");b.setAttribute("aria-expanded",o?"true":"false");d.documentElement.style.overflow=o?"hidden":"";if(o){x.focus()}else{b.focus()}}
  b.addEventListener("click",function(){set(true)});x.addEventListener("click",function(){set(false)});
  d.addEventListener("keydown",function(e){if(e.key==="Escape"&&dr.classList.contains("is-open"))set(false)});
  $$("a",dr).forEach(function(a){a.addEventListener("click",function(){d.documentElement.style.overflow=""})});
  w.addEventListener("resize",function(){if(w.innerWidth>=1180&&dr.classList.contains("is-open"))set(false)});
  dr.setAttribute("aria-hidden","true");
})();

/* dock */
(function(){var k=$("#dock"),x=$("#dock-x");if(!k)return;if(st("pmldock")==="1"){k.hidden=true;return}
  x.addEventListener("click",function(){k.hidden=true;st("pmldock","1")})})();

/* hide the sticky bar while an in-page action is on screen; dock fades on phones */
(function(){
  var bar=$(".bar");if(!bar||!("IntersectionObserver" in w))return;
  var seen={};var tg=$$(".hero__act,[data-tool='compact'] .tool__cta,#cform button[type=submit],.band__a");
  var io=new IntersectionObserver(function(es){es.forEach(function(e){seen[e.target.__i]=e.isIntersecting});bar.classList.toggle("is-off",Object.keys(seen).some(function(k){return seen[k]}))},{rootMargin:"0px 0px -64px 0px"});
  tg.forEach(function(t,i){t.__i=i;io.observe(t)});
})();
(function(){var k=$("#dock");if(!k||!w.matchMedia("(max-width:899px)").matches)return;setTimeout(function(){k.classList.add("is-fade")},7000)})();

/* reveal */
(function(){
  var els=$$(".reveal,.stagger");if(!els.length)return;
  function show(el){el.classList.add("is-in")}
  if(reduce||!("IntersectionObserver" in w)){els.forEach(show);return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.08});
  els.forEach(function(el){io.observe(el)});
  function sweep(){var vh=w.innerHeight;els.forEach(function(el){if(el.getBoundingClientRect().top<vh*.96)show(el)})}
  w.addEventListener("load",sweep);w.addEventListener("scroll",sweep,{passive:true});w.addEventListener("resize",sweep);w.addEventListener("pageshow",sweep);sweep();
})();

/* photo switcher (hero + product gallery) */
$$("[data-switcher]").forEach(function(root){
  var slides=$$(".slide",root),thumbs=$$(".thumb",root),cur=0,timer=null,paused=false;
  if(slides.length<2)return;
  function go(i){cur=(i+slides.length)%slides.length;slides.forEach(function(s,k){s.classList.toggle("is-on",k===cur)});thumbs.forEach(function(t,k){t.classList.toggle("is-on",k===cur);t.setAttribute("aria-pressed",k===cur?"true":"false")})}
  thumbs.forEach(function(t,k){t.addEventListener("click",function(){go(k);stop(true)})});
  function stop(forever){if(timer){clearInterval(timer);timer=null}if(forever)paused=true}
  function start(){if(paused||reduce||!root.hasAttribute("data-auto")||timer)return;timer=setInterval(function(){if(!d.hidden)go(cur+1)},5500)}
  root.addEventListener("mouseenter",function(){stop(false)});root.addEventListener("mouseleave",start);
  root.addEventListener("focusin",function(){stop(true)});root.addEventListener("touchstart",function(){stop(true)},{passive:true});
  d.addEventListener("visibilitychange",function(){if(d.hidden)stop(false);else start()});
  start();
});

/* data */
var dataEl=$("#pml-data"),DATA=null;
if(dataEl){try{DATA=JSON.parse(dataEl.textContent)}catch(e){DATA=null}}
function qs(n){var m=new RegExp("[?&]"+n+"=([^&]*)").exec(w.location.search);return m?decodeURIComponent(m[1].replace(/\+/g," ")):""}
function cmToStr(n){return String(n).replace(".",",")}

/* compact reception calculator (home) */
(function(){
  var root=$('[data-tool="compact"]');if(!root||!DATA)return;
  var recs=DATA.groups.filter(function(g){return g.kind==="reception"});if(!recs.length)return;
  var short={point:"Point",z2:"Z2",z2l:"Z2 mensole laccate"};
  var seg=$("[data-seg]",root),chips=$("[data-chips]",root),box=$("[data-box]",root),boxw=$("[data-boxw]",root),boxd=$("[data-boxd]",root),dims=$("[data-dims]",root),price=$("[data-price]",root),opt=$("[data-opt]",root),add=$("[data-add]",root),ask=$("[data-ask]",root);
  var g=recs[0],ri=3;
  function render(){
    seg.innerHTML="";recs.forEach(function(x,i){var b=d.createElement("button");b.type="button";b.textContent=short[x.id]||x.title;b.setAttribute("aria-pressed",x===g?"true":"false");b.addEventListener("click",function(){g=x;ri=Math.min(ri,g.rows.length-1);render()});seg.appendChild(b)});
    chips.innerHTML="";g.rows.forEach(function(r,i){var b=d.createElement("button");b.type="button";b.textContent=r.w;b.setAttribute("aria-pressed",i===ri?"true":"false");b.setAttribute("aria-label","Larghezza "+r.w+" centimetri");b.addEventListener("click",function(){ri=i;render()});chips.appendChild(b)});
    var r=g.rows[ri];
    box.style.setProperty("--w",r.w);box.style.setProperty("--d",g.depth);boxw.textContent="L "+r.w+" cm";boxd.textContent="P "+cmToStr(g.depth)+" cm";
    dims.textContent="Pianta in scala: L "+cmToStr(r.w)+" × P "+cmToStr(g.depth)+" × H "+cmToStr(g.h)+" cm";
    price.innerHTML=eur(r.p)+"<small>+ IVA</small>";
    var o=null;(g.opts||[]).forEach(function(x){if(x.id==="led"+r.id)o=x;if(g.id==="z2"&&x.id==="z2flip")o=x});
    var txt="";if(o){if(o.id.indexOf("led")===0){txt="Con kit led per le mensole ("+o.t.split(" con ")[1]+"): + "+eur(o.p)+" + IVA"}else{txt="Flip-top passacavi su piano: + "+eur(o.p)+" + IVA"}}
    opt.textContent=txt;
    add.href=DATA.tool+"?add="+encodeURIComponent(g.id+":"+r.id)+"#g-"+g.id;
    var body="Buongiorno,%0D%0Avorrei un preventivo per: "+encodeURIComponent(r.t+" ("+g.title+") - listino "+eur(r.p)+" + IVA")+"%0D%0A%0D%0ANome e azienda:%0D%0ATelefono:";
    ask.href="mailto:"+DATA.mail+"?subject="+encodeURIComponent("Richiesta preventivo: "+g.title+" L."+r.w)+"&body="+body;
  }
  render();
})();

/* full quote tool */
(function(){
  var root=$('[data-tool="full"]');if(!root||!DATA)return;
  var map={};DATA.groups.forEach(function(g){g.rows.concat(g.opts).forEach(function(r){map[g.id+":"+r.id]={g:g,r:r}})});
  var qty={};
  try{var saved=JSON.parse(st("pmlq")||"{}");Object.keys(saved).forEach(function(k){if(map[k])qty[k]=saved[k]})}catch(e){}
  var qt=$("#qt"),tog=$("#qt-toggle"),lines=$("[data-lines]",qt),emp=$("[data-empty]",qt),n=$("[data-n]",qt),t1=$("[data-total]",qt),t2=$("[data-total2]",qt),send=$("[data-send]",qt),copy=$("[data-copy]",qt),stat=$("[data-status]",qt);
  var fn=$('[data-f="nome"]',qt),ft=$('[data-f="tel"]',qt);
  $$(".row").forEach(function(row){
    var id=row.getAttribute("data-id"),s=$(".stepper",row),lab=$(".row__t",row).textContent.replace(/^Optional · /,"");
    s.innerHTML='<button type="button" aria-label="Meno: '+lab.replace(/"/g,"")+'">−</button><output aria-live="off">0</output><button type="button" aria-label="Più: '+lab.replace(/"/g,"")+'">+</button>';
    var b=s.querySelectorAll("button");
    b[0].addEventListener("click",function(){set(id,(qty[id]||0)-1)});b[1].addEventListener("click",function(){set(id,(qty[id]||0)+1)});
  });
  function set(id,v){v=Math.max(0,Math.min(99,v));if(v)qty[id]=v;else delete qty[id];paint();st("pmlq",JSON.stringify(qty))}
  function text(){
    var tot=0,l=[];Object.keys(qty).forEach(function(k){var m=map[k],q=qty[k],sub=q*m.r.p;tot+=sub;l.push("- "+q+" x "+m.r.t+" ("+m.g.title+") - "+eur(m.r.p)+" cad. = "+eur(sub))});
    return {tot:tot,body:"Buongiorno,\r\nvorrei un preventivo per questi articoli (prezzi di listino dal sito, IVA esclusa):\r\n\r\n"+l.join("\r\n")+"\r\n\r\nTotale di listino: "+eur(tot)+" + IVA (trasporto e montaggio esclusi)\r\n\r\nNome e azienda: "+(fn.value||"")+"\r\nTelefono: "+(ft.value||"")+"\r\n"};
  }
  function paint(){
    var keys=Object.keys(qty),c=0,tot=0;lines.innerHTML="";
    $$(".row").forEach(function(row){var id=row.getAttribute("data-id"),q=qty[id]||0;$("output",row).textContent=q;row.classList.toggle("has",q>0)});
    keys.forEach(function(k){var m=map[k],q=qty[k];c+=q;tot+=q*m.r.p;var li=d.createElement("li");li.innerHTML="<span>"+q+" × "+esc(m.r.t)+"</span><b>"+eur(q*m.r.p)+"</b><small>"+esc(m.g.title)+" · "+eur(m.r.p)+" cad.</small>";lines.appendChild(li)});
    emp.hidden=keys.length>0;n.textContent=c;t1.textContent=eur(tot);t2.textContent=eur(tot);
    var x=text();send.href="mailto:"+DATA.mail+"?subject="+encodeURIComponent("Richiesta preventivo: "+c+" articoli, "+eur(tot)+" + IVA")+"&body="+encodeURIComponent(x.body);
    send.setAttribute("aria-disabled",keys.length?"false":"true");
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  send.addEventListener("click",function(e){if(!Object.keys(qty).length){e.preventDefault();stat.textContent="Aggiungete almeno un articolo.";return}stat.textContent="Si apre il vostro programma di posta con la richiesta già scritta."});
  copy.addEventListener("click",function(){
    if(!Object.keys(qty).length){stat.textContent="Aggiungete almeno un articolo.";return}
    var t=text().body;
    function ok(){stat.textContent=DATA.labels.copied}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){stat.textContent="Copia non riuscita: usate il pulsante di invio."})}else{stat.textContent="Copia non disponibile: usate il pulsante di invio."}
  });
  [fn,ft].forEach(function(i){i.addEventListener("input",paint)});
  tog.addEventListener("click",function(){var o=!qt.classList.contains("is-open");qt.classList.toggle("is-open",o);tog.setAttribute("aria-expanded",o?"true":"false")});
  var add=qs("add");if(add){add.split(",").forEach(function(id){if(map[id]&&!qty[id])qty[id]=1});var g=add.split(":")[0],det=d.getElementById("g-"+g);if(det)det.open=true}
  paint();
  var h=w.location.hash.replace("#","");if(h){var dd=d.getElementById(h);if(dd&&dd.tagName==="DETAILS")dd.open=true}
  var gs=$("#gsel");if(gs)gs.addEventListener("change",function(){var dd=d.getElementById(gs.value);if(dd){dd.open=true;dd.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});gs.value=""}});
  $$(".gnav a").forEach(function(a){a.addEventListener("click",function(){var dd=d.getElementById(a.getAttribute("href").slice(1));if(dd)dd.open=true})});
})();

/* contact form -> mailto */
(function(){
  var f=$("#cform");if(!f)return;
  var p=qs("prodotto"),sel=$('[data-f="prodotto"]',f);
  if(p&&sel){var found=false;Array.prototype.forEach.call(sel.options,function(o){if(o.value===p){sel.value=p;found=true}});if(!found){var o=d.createElement("option");o.value=p;o.textContent=p;sel.appendChild(o);sel.value=p}}
  f.addEventListener("submit",function(e){
    e.preventDefault();var s=$("[data-status]",f),miss=null;
    $$("[required]",f).forEach(function(i){if(!i.value.trim()&&!miss)miss=i});
    if(miss){s.textContent="Completate i campi obbligatori.";miss.focus();return}
    var v=function(k){var i=$('[data-f="'+k+'"]',f);return i?i.value.trim():""};
    var body="Nome e cognome: "+v("nome")+"\r\nAzienda / Professione: "+v("azienda")+"\r\nTelefono: "+v("telefono")+"\r\nEmail: "+v("email")+"\r\nCittà / Provincia: "+v("citta")+"\r\nProdotto: "+v("prodotto")+"\r\n\r\n"+v("messaggio")+"\r\n";
    s.textContent="Si apre il vostro programma di posta con la richiesta già scritta.";
    w.location.href="mailto:pml@pmloffice.it?subject="+encodeURIComponent("Richiesta preventivo"+(v("prodotto")?": "+v("prodotto"):""))+"&body="+encodeURIComponent(body);
  });
})();
})();
