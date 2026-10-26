(function(){
  "use strict";
  var d=document, root=d.documentElement;
  root.classList.add("js");
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s,c){return (c||d).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

  /* drawer */
  var burger=$(".burger"), drawer=$(".drawer");
  if(burger&&drawer){
    var close=$(".drawer-close");
    function setDrawer(o){drawer.classList.toggle("open",o);burger.setAttribute("aria-expanded",o?"true":"false");root.style.overflow=o?"hidden":"";if(o&&close)close.focus();else if(!o)burger.focus()}
    burger.addEventListener("click",function(){setDrawer(true)});
    if(close)close.addEventListener("click",function(){setDrawer(false)});
    d.addEventListener("keydown",function(e){if(e.key==="Escape"&&drawer.classList.contains("open"))setDrawer(false)});
    $$("a",drawer).forEach(function(a){a.addEventListener("click",function(){setDrawer(false)})});
  }

  /* dock */
  var dock=$(".dock");
  if(dock){
    if(store("mdock")==="1")dock.hidden=true;
    var dx=$("button",dock); if(dx)dx.addEventListener("click",function(){dock.hidden=true;store("mdock","1")});
  }

  /* reveal + counters */
  function count(el){
    var to=parseFloat(el.getAttribute("data-to")); if(isNaN(to)||reduce)return;
    var t0=null,dur=1400;
    function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur);var e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(step)}
    el.textContent="0";requestAnimationFrame(step);
  }
  var revealed=new WeakSet();
  function activate(el){
    if(revealed.has(el))return;revealed.add(el);el.classList.add("in");
    $$("[data-to]",el).forEach(count);if(el.hasAttribute("data-to"))count(el);
  }
  var rvs=$$(".rv");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){activate(e.target);io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.05});
    rvs.forEach(function(el){io.observe(el)});
  }
  function sweep(){var vh=window.innerHeight;rvs.forEach(function(el){if(el.getBoundingClientRect().top<vh*.96)activate(el)})}
  ["load","scroll","resize","pageshow"].forEach(function(ev){window.addEventListener(ev,sweep,{passive:true})});
  sweep();
  if(!("IntersectionObserver" in window)){rvs.forEach(activate)}

  /* open / closed (hours: Mon-Fri 08:00-16:30, UK time) */
  $$("[data-open]").forEach(function(el){
    try{
      var f=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",weekday:"short",hour:"numeric",minute:"numeric",hour12:false}).formatToParts(new Date());
      var o={};f.forEach(function(p){o[p.type]=p.value});
      var mins=(+o.hour%24)*60+(+o.minute), wd=o.weekday;
      var open=["Mon","Tue","Wed","Thu","Fri"].indexOf(wd)>-1&&mins>=480&&mins<990;
      el.textContent=open?"Open now":"Closed now";el.setAttribute("data-state",open?"open":"closed");
    }catch(e){}
  });

  /* video facade */
  $$(".video button").forEach(function(b){
    b.addEventListener("click",function(){
      var id=b.getAttribute("data-yt"),w=b.parentNode;
      var f=d.createElement("iframe");
      f.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?autoplay=1&rel=0";
      f.title=b.getAttribute("data-title")||"Millitec video";f.allow="autoplay; encrypted-media; picture-in-picture";f.allowFullscreen=true;f.loading="lazy";
      w.innerHTML="";w.appendChild(f);
    });
  });

  /* gallery */
  $$(".gal").forEach(function(g){
    var main=$(".main img",g);
    $$(".thumbs button",g).forEach(function(b){
      b.addEventListener("click",function(){
        main.src=b.getAttribute("data-full");main.srcset=b.getAttribute("data-set")||"";main.alt=b.getAttribute("data-alt")||"";
        $$(".thumbs button",g).forEach(function(x){x.setAttribute("aria-current",x===b?"true":"false")});
        var mm=$(".main",g);if(mm)mm.classList.toggle("photo",b.getAttribute("data-photo")==="1");
      });
    });
  });

  /* catalogue filter */
  var cat=$("[data-catalogue]");
  if(cat){
    var items=$$("[data-fam]",cat), btns=$$("[data-filter]"), q=$("[data-q]"), none=$("[data-none]"), fam="all";
    function apply(){
      var t=(q&&q.value||"").toLowerCase().trim(), n=0;
      items.forEach(function(it){
        var ok=(fam==="all"||it.getAttribute("data-fam")===fam)&&(!t||it.getAttribute("data-s").indexOf(t)>-1);
        it.hidden=!ok;if(ok)n++;
      });
      if(none)none.hidden=n>0;
    }
    btns.forEach(function(b){b.addEventListener("click",function(){fam=b.getAttribute("data-filter");btns.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});apply()})});
    if(q)q.addEventListener("input",apply);
    var hp=(location.hash||"").replace("#","");
    if(hp){var hb=$('[data-filter="'+hp+'"]');if(hb)hb.click()}
  }

  /* signature tool: will it run on my line? */
  $$("[data-tool]").forEach(function(tool){
    var dataEl=$("script[type='application/json']",tool);if(!dataEl)return;
    var D=JSON.parse(dataEl.textContent), base=D.base;
    var out=$("[data-out]",tool), act=$("[data-act]",tool);
    var fs=$("[name=s]",tool), sw=$("[data-sfield]",tool), fh=$("[name=h]",tool), fw=$("[name=w]",tool), fr=$("[name=r]",tool), fwrap=$("[data-wfield]",tool), hlabel=$("[data-hlabel]",tool);
    function val(el){var v=parseFloat(String(el.value).replace(",","."));return isFinite(v)&&v>0?v:null}
    function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
    function ptype(){var c=$("input[name=p]:checked",tool);return c?c.value:"sandwich"}
    function evalM(m,h,w,r){
      var res={m:m,size:"check",why:"",cap:null,n:1};
      var reasons=[],ok=true;
      if(m.belt){ // conveyors and belt-width machines
        var b=m.belt;
        if(w<=b[0]){res.size="fit";res.why="Product width "+w+" mm sits within the "+b[0]+" mm belt."}
        else if(b[1]>b[0]&&w<=b[1]){res.size="fit";res.why="Fits the wider version only: "+b[1]+" mm belt (width "+w+" mm)."}
        else{res.size="no";res.why="Product width "+w+" mm is wider than the "+(b[1]>b[0]?b[1]:b[0])+" mm belt."}
        if(m.env&&m.env[1]<999&&h>m.env[1]){res.size="no";res.why="Height "+h+" mm is over the "+m.env[1]+" mm maximum."}
      } else if(m.square){
        var lo=m.square[0],hi=m.square[1];
        if(w>=lo&&w<=hi){res.size="fit";res.why="Bread size "+w+" mm square is inside the "+lo+" to "+hi+" mm range."}
        else{res.size="no";res.why="Takes bread "+lo+" to "+hi+" mm square; yours is "+w+" mm."}
      } else if(m.env){
        var e=m.env, hmin=e[0],hmax=e[1],wmax=e[2];
        if(m.round){ if(w<hmin||w>hmax){ok=false;reasons.push("diameter "+w+" mm is outside the "+hmin+" to "+hmax+" mm range")} }
        else{
          if(hmin&&h<hmin){ok=false;reasons.push("height "+h+" mm is under the "+hmin+" mm minimum")}
          if(h>hmax){ok=false;reasons.push("height is "+(h-hmax)+" mm over the "+hmax+" mm maximum")}
          if(w>wmax){ok=false;reasons.push("width is "+(w-wmax)+" mm over the "+wmax+" mm maximum")}
        }
        if(ok){res.size="fit";res.why=m.round?"Diameter "+w+" mm is inside "+hmin+" to "+hmax+" mm.":"Inside the published product size (height "+(hmin?hmin+" to ":"up to ")+hmax+" mm, width up to "+wmax+" mm)."}
        else{res.size="no";res.why="Outside the published product size: "+reasons.join("; ")+"."}
      } else {
        res.size="check";res.why=m.note||"No product size range is published for this machine."
      }
      // rate
      var cap=m.rate;
      if(m.stack&&res.size==="fit"){
        var n=Math.max(1,Math.min(3,Math.floor(m.env[1]/h)));var best=0;for(var k=1;k<=n;k++)best=Math.max(best,m.stack[k]||0);cap=best||m.rate;
        res.stacked=n;
      }
      res.cap=cap;
      if(res.size==="fit"&&cap&&r){
        if(r>cap){res.n=Math.ceil(r/cap);res.size="multi"}
      }
      return res;
    }
    function render(){
      var p=ptype(), prod=D.products.filter(function(x){return x.key===p})[0];
      var round=p==="produce", hasSlice=prod.slice&&prod.slice.length>0;
      if(fwrap)fwrap.hidden=round;
      if(sw)sw.hidden=!hasSlice;
      if(hlabel)hlabel.textContent=round?"Diameter (mm)":(p==="sandwich"||p==="toastie")?"Finished height (mm)":"Height (mm)";
      var h=val(fh), w=round?h:val(fw), r=val(fr), sl=hasSlice?val(fs):null;
      if(!h||(!round&&!w)||(hasSlice&&!sl)){
        out.innerHTML='<div class="tool-empty"><b>Enter your product size to see which Millitec machines take it.</b><span>'+(hasSlice?'For a sandwich the check needs the bread slice thickness (butterers and the de-nester see the single slice) and the finished height (cutters and conveyors see the whole sandwich). ':'')+'Stage by stage, using the published product sizes and speeds from millitec.com. Try an example to see how it reads.</span></div>';
        if(act)act.hidden=true;return;
      }
      var stages=[],covered=0,total=0,ceil=null,ceilBy="",lines=[];
      prod.stages.forEach(function(st){
        var codes=(D.tool[p]||{})[st]||[];if(!codes.length)return;
        total++;
        var hh=(prod.slice&&prod.slice.indexOf(st)>-1)?sl:h;
        var rows=codes.map(function(c){return evalM(D.machines[c],hh,w,r)});
        var any=rows.some(function(x){return x.size==="fit"||x.size==="multi"});
        var chk=rows.some(function(x){return x.size==="check"});
        var state=any?"covered":(chk?"check":"none");
        if(any)covered++;
        if(any){
          var fits=rows.filter(function(x){return x.size==="fit"||x.size==="multi"&&x.cap});
          var cmax=0,cm=null;rows.forEach(function(x){if((x.size==="fit"||x.size==="multi")&&x.cap&&x.cap>cmax){cmax=x.cap;cm=x.m}});
          if(cmax&&(ceil===null||cmax<ceil)){ceil=cmax;ceilBy=st+" ("+cm.code+")"}
          lines.push(st+": "+rows.filter(function(x){return x.size==="fit"||x.size==="multi"}).map(function(x){return x.m.code+" "+x.m.name+(x.cap?" ("+x.cap+"/min published)":"")}).join("; "));
        } else if(chk){lines.push(st+": to be confirmed with Millitec")}
        else{lines.push(st+": no published match, custom solution to discuss")}
        stages.push({st:st,rows:rows,state:state});
      });
      var html='<div class="sumbar"><b>'+covered+' of '+total+(total===1?' stage has':' stages have')+' a Millitec machine for '+(round?esc(h)+' mm round':(hasSlice?esc(sl)+' mm slice, ':'')+esc(h)+' mm high &times; '+esc(w)+' mm wide')+(r?' at '+esc(r)+' per minute':'')+'.</b>';
      if(ceil){html+='<span>Published speed ceiling for one machine per stage: <strong>'+ceil+' per minute</strong>, set by '+esc(ceilBy)+'.'+(r?(r<=ceil?' Your target of '+r+' per minute is inside it.':' Your target of '+r+' per minute needs '+Math.ceil(r/ceil)+' in parallel at that stage.'):'')+'</span>'}
      html+='</div><ol class="belt">';
      stages.forEach(function(s){
        var pill=s.state==="covered"?'<span class="pill ok">Covered</span>':s.state==="check"?'<span class="pill warn">Confirm with Millitec</span>':'<span class="pill no">No published match</span>';
        html+='<li class="stage '+s.state+'"><h4>'+esc(s.st)+pill+'</h4>';
        s.rows.forEach(function(x){
          var m=x.m,lab=x.size==="fit"?"Fits":x.size==="multi"?"Fits, "+x.n+" needed":x.size==="check"?"Check":"Does not fit";
          var rate="";
          if(x.size==="fit"||x.size==="multi"){ if(x.cap)rate=" Published speed: up to "+x.cap+" per minute"+(x.stacked>1?" ("+x.stacked+" stacked)":"")+(m.lanes?" ("+esc(m.lanes)+")":"")+"."+(x.size==="multi"?" For "+r+" per minute run "+x.n+" machines in parallel.":""); else rate=" No speed is published for this machine."}
          html+='<div class="mrow '+x.size+'"><a class="code" href="'+base+'machines/'+m.slug+'/">'+esc(m.code)+'</a><span class="nm"><span class="st">'+lab+'</span>'+esc(m.name)+'</span><span class="why">'+esc(x.why)+rate+'</span></div>';
        });
        html+='</li>';
      });
      html+='</ol><p class="fine">Indicative only. Built from the product sizes and speeds published on millitec.com; Millitec confirms every line against your product.</p>';
      out.innerHTML=html;
      // action
      if(act){
        var subj="Line check: "+prod.label+", "+(round?h+" mm round":(hasSlice?sl+" mm slice, ":"")+h+" x "+w+" mm")+(r?", "+r+" per minute":"");
        var body="Hello Millitec,\n\nI used the line check on your site.\nProduct: "+prod.label+"\nSize: "+(round?h+" mm diameter":h+" mm high x "+w+" mm wide")+"\n"+(r?"Target rate: "+r+" per minute\n":"")+"\nWhat it showed:\n- "+lines.join("\n- ")+"\n\nCould you confirm the line and send a quote? My name, company, phone and country:\n";
        var a=$("[data-mail]",act);if(a)a.href="mailto:"+D.sales+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body);
        act.hidden=false;
      }
    }
    var jb=$("[data-jump]",tool);if(jb)jb.addEventListener("click",function(){out.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"})});
    $$("input",tool).forEach(function(i){i.addEventListener("input",render);i.addEventListener("change",render)});
    $$("[data-example]",tool).forEach(function(b){b.addEventListener("click",function(){
      var p=b.getAttribute("data-p"),el=$("input[name=p][value="+p+"]",tool);if(el)el.checked=true;
      fh.value=b.getAttribute("data-h");fw.value=b.getAttribute("data-w")||"";fr.value=b.getAttribute("data-r")||"";if(fs)fs.value=b.getAttribute("data-s")||"";render();
      out.scrollIntoView({behavior:reduce?"auto":"smooth",block:"nearest"});
    })});
    var qs=new URLSearchParams(location.search);
    if(qs.get("p")){var pe=$("input[name=p][value="+qs.get("p")+"]",tool);if(pe)pe.checked=true}
    if(qs.get("s")&&fs)fs.value=qs.get("s");if(qs.get("h"))fh.value=qs.get("h");if(qs.get("w"))fw.value=qs.get("w");if(qs.get("r"))fr.value=qs.get("r");
    if(!fh.value&&!(qs.get("p"))){var ex0=$("[data-example]",tool);if(ex0){fh.value=ex0.getAttribute("data-h");fw.value=ex0.getAttribute("data-w")||"";fr.value=ex0.getAttribute("data-r")||"";if(fs)fs.value=ex0.getAttribute("data-s")||""}}
    render();
  });
})();
