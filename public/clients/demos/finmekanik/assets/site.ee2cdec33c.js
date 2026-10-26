(function(){
  "use strict";
  var d=document,w=window;
  function $(s,r){return (r||d).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}
  /* drawer */
  var dr=$("#drawer"),bg=$("#burger"),bx=$("#burger-x");
  function setDrawer(o){if(!dr)return;dr.classList.toggle("open",o);dr.setAttribute("aria-hidden",o?"false":"true");d.body.classList.toggle("lock",o);if(bg)bg.setAttribute("aria-expanded",o?"true":"false");if(o&&bx)bx.focus();else if(bg&&!o)bg.focus&&0}
  if(bg)bg.addEventListener("click",function(){setDrawer(true)});
  if(bx)bx.addEventListener("click",function(){setDrawer(false)});
  if(dr)$$("a",dr).forEach(function(a){a.addEventListener("click",function(){setDrawer(false)})});
  d.addEventListener("keydown",function(e){if(e.key==="Escape")setDrawer(false)});
  w.addEventListener("resize",function(){if(w.innerWidth>=1180)setDrawer(false)});
  /* dock */
  var dock=$("#dock"),dx=$("#dock-x");
  try{if(sessionStorage.getItem("fm-dock")==="1"&&dock)dock.hidden=true}catch(e){}
  if(dx)dx.addEventListener("click",function(){dock.hidden=true;try{sessionStorage.setItem("fm-dock","1")}catch(e){}});
  /* reveals */
  var rv=$$(".rv");
  function reveal(el){el.classList.add("in")}
  if("IntersectionObserver" in w){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){reveal(en.target);io.unobserve(en.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:0.05});
    rv.forEach(function(el){io.observe(el)});
  }else rv.forEach(reveal);
  function sweep(){var vh=w.innerHeight;rv.forEach(function(el){if(!el.classList.contains("in")&&el.getBoundingClientRect().top<vh*0.96)reveal(el)})}
  ["load","scroll","resize","pageshow"].forEach(function(ev){w.addEventListener(ev,sweep,{passive:true})});sweep();
  /* film: video is only requested after the visitor presses play */
  $$("[data-film]").forEach(function(f){
    var b=$(".film__btn",f);if(!b)return;
    b.addEventListener("click",function(){
      var v=d.createElement("video");v.controls=true;v.autoplay=true;v.playsInline=true;v.preload="auto";v.src=f.getAttribute("data-src");v.setAttribute("aria-label",b.getAttribute("aria-label"));
      b.replaceWith(v);v.play&&v.play().catch(function(){});
    });
  });
  /* signature tool: your part's route through Finmekanik */
  $$("[data-tool]").forEach(function(root){
    var raw=$("[data-tooldata]",root);if(!raw)return;
    var D=JSON.parse(raw.textContent),U=D.ui,res=$("[data-res]",root);
    var S={mat:"",need:[],series:"",drawing:""};
    function label(list,k){for(var i=0;i<list.length;i++)if(list[i][0]===k)return list[i][1];return k}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
    function active(s){var wh=s.when||{};
      if(wh.need&&S.need.indexOf(wh.need)<0)return false;
      if(wh.series&&wh.series.indexOf(S.series)<0)return false;
      return true}
    function brief(steps){
      var L=U.mail_lines,o=U.mail_intro+"\n"+L.mat+": "+label(D.mat,S.mat)+"\n";
      if(S.need.length)o+=L.need+": "+S.need.map(function(k){return label(D.needs,k)}).join(", ")+"\n";
      if(S.series)o+=L.series+": "+U.series_label[S.series]+"\n";
      if(S.drawing)o+=L.drawing+": "+(S.drawing==="yes"?L.draw_yes:L.draw_no)+"\n";
      return o+U.mail_outro}
    function render(){
      var note=$("[data-note=mat]",root);
      var jp=$("[data-jump]",root);
      if(jp){jp.hidden=!S.mat;if(S.mat){jp.firstChild.nodeValue=U.jump+" ("+D.steps.filter(active).length+" "+U.steps_word+") "}}
      if(!S.mat){res.innerHTML='<p class="tool__empty">'+esc(U.empty)+'</p>';if(note)note.textContent="";return}
      if(note)note.textContent=D.matNote[D.matTier[S.mat]]||"";
      var steps=D.steps.filter(active),h="";
      var parts=[label(D.mat,S.mat)];if(S.series)parts.push(U.series_label[S.series]);
      h+='<p class="res__sum">'+esc(parts.join(", "))+' · '+steps.length+' '+esc(U.steps_word)+'</p><ol class="route">';
      steps.forEach(function(s,i){h+='<li><img src="'+s.src+'" width="'+s.w+'" height="'+s.h+'" alt="" loading="lazy"><div><h4><span>0'+(i+1)+'</span>'+esc(s.t)+'</h4><p>'+esc(s.x)+'</p><a href="'+s.href+'">'+esc(D.more)+'</a></div></li>'});
      h+='</ol><div class="res__check"><h4>'+esc(U.checklist_h)+'</h4><ul>'+U.checklist.map(function(c,i){return "<li>"+esc(c)+(i===0&&S.drawing==="yes"?" "+esc(U.attach):"")+"</li>"}).join("")+'</ul><p>'+esc(U.checklist_note)+'</p></div>';
      var b=brief(steps),subj=U.mail_subject.replace("{mat}",label(D.mat,S.mat)).replace("{series}",S.series?U.series_label[S.series]:"-");
      var href="mailto:"+D.to+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(b);
      h+='<div class="res__act"><a class="btn" href="'+href+'">'+esc(U.mail_to_label)+'</a><a class="btn btn--ghost" href="tel:'+D.tel.replace(/[^\d+]/g,"")+'">'+esc(U.call)+'</a><button type="button" class="btn btn--ghost" data-copy>'+esc(U.copy)+'</button></div><p class="res__call">'+esc(U.call_note)+'</p>';
      res.innerHTML=h;
      var cp=$("[data-copy]",res);
      if(cp)cp.addEventListener("click",function(){
        var t=subj+"\n\n"+b;
        function done(){cp.textContent=U.copied;setTimeout(function(){cp.textContent=U.copy},1600)}
        if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,function(){});else{var ta=d.createElement("textarea");ta.value=t;d.body.appendChild(ta);ta.select();try{d.execCommand("copy");done()}catch(e){}d.body.removeChild(ta)}
      });
    }
    $$(".opt",root).forEach(function(o){
      o.addEventListener("click",function(){
        var g=o.getAttribute("data-group"),v=o.getAttribute("data-val");
        if(g==="need"){var i=S.need.indexOf(v);if(i<0)S.need.push(v);else S.need.splice(i,1);o.setAttribute("aria-pressed",i<0?"true":"false")}
        else{S[g]=(S[g]===v)?"":v;$$('.opt[data-group="'+g+'"]',root).forEach(function(x){x.setAttribute("aria-pressed",x.getAttribute("data-val")===S[g]?"true":"false")})}
        render();
      });
    });
    render();
  });
})();
