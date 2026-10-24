(function(){
var F={"preset": [{"id": "Evo 33", "dia": 320, "h": 360, "t": "IBVH", "page": "evo"}, {"id": "Evo 35", "dia": 320, "h": 500, "t": "IBVH", "page": "evo"}, {"id": "Evo 36", "dia": 320, "h": 600, "t": "IBVH", "page": "evo"}, {"id": "Evo 53", "dia": 520, "h": 360, "t": "IBVH", "page": "evo"}, {"id": "Evo 55", "dia": 520, "h": 500, "t": "IBVH", "page": "evo"}, {"id": "Evo 75", "dia": 700, "h": 500, "t": "IBVH", "page": "evo"}, {"id": "Evo 76", "dia": 700, "h": 600, "t": "IBVH", "page": "evo"}, {"id": "ASTRID", "dia": 400, "h": 400, "t": "IVH", "page": "astrid", "note": "asse X 400 mm, asse Z 400 mm da scheda"}, {"id": "GA 400", "dia": 400, "h": 400, "t": "IVH", "page": "ga400"}, {"id": "LOREL 320", "dia": 200, "h": 320, "t": "IVH", "page": "lorel-320"}, {"id": "T718", "dia": 600, "h": 600, "t": "IBVH", "page": null, "note": "famiglia con più formati, da 250 a 600 mm di diametro e da 300 a 600 mm di altezza, dalla sezione Novità 2015"}], "turn": {"maxdia": 50, "machine": "Citizen Miyano BNJ 51 SY6", "materials": ["Acciaio", "Acciaio inox e speciale", "Alluminio", "Bronzo", "Ottone", "Altro materiale"]}, "email": "info@ta-srl.it", "bnj": {"name": "Citizen Miyano BNJ 51 SY6", "text": "Tornio bimandrino, passaggio barra diametro 50 mm, 2 torrette e asse Y, abbinato al caricatore di barre TOP AUTOMAZIONI mod. FUSION.", "story": "Nel 2018 entra in azienda il Citizen BNJ 51: un grande salto di qualità, che permette di lavorare dalla piccola e media alla grande serie. L'azienda lavora anche dal pezzo singolo, partendo solo dal disegno e arrivando alla soluzione finale produttiva."}, "base": "/clients/demos/ta-srl", "pages": {"evo": "EVO", "astrid": "ASTRID", "ga400": "GA 400", "lorel-320": "LOREL 320"}}, d=document, $=function(s,r){return (r||d).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* dock */
var dock=$('#dock');try{if(sessionStorage.getItem('dockx'))dock.hidden=true}catch(e){}
$('#dockx').addEventListener('click',function(){dock.hidden=true;try{sessionStorage.setItem('dockx','1')}catch(e){}});
/* menu */
var bg=$('#burger'),nav=$('#nav');
function setMenu(o){nav.classList.toggle('open',o);bg.setAttribute('aria-expanded',o);bg.setAttribute('aria-label',o?'Chiudi il menu':'Apri il menu');d.body.style.overflow=o?'hidden':''}
bg.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
d.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
$$('a',nav).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
window.addEventListener('resize',function(){if(innerWidth>1060)setMenu(false)});
/* reveal */
var rv=$$('.reveal');
$$('.reveal').forEach(function(el){var p=el.parentElement,sib=$$(':scope > .reveal',p),i=sib.indexOf(el);if(i>0)el.style.setProperty('--i',Math.min(i,5))});
if(rm||!('IntersectionObserver' in window)){rv.forEach(function(e){e.classList.add('in')})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.05});rv.forEach(function(e){io.observe(e)})}
/* timeline progress */
$$('.tl').forEach(function(tl){
 if(rm){tl.style.setProperty('--tlp',1);return}
 function f(){var r=tl.getBoundingClientRect(),h=innerHeight,p=(h*.7-r.top)/r.height;tl.style.setProperty('--tlp',Math.max(0,Math.min(1,p)).toFixed(3))}
 f();addEventListener('scroll',f,{passive:true});addEventListener('resize',f);
});
/* gallery */
var gal=$('#gal');
if(gal){
 $$('.gchips button').forEach(function(b){b.addEventListener('click',function(){
  $$('.gchips button').forEach(function(x){x.classList.toggle('on',x===b)});
  var g=b.getAttribute('data-g');$$('li',gal).forEach(function(li){li.hidden=!(g==='all'||li.getAttribute('data-g')===g)});
 })});
 var lb=$('#lb');
 gal.addEventListener('click',function(e){var b=e.target.closest('.gb');if(!b)return;var i=$('img',lb);i.src=b.getAttribute('data-full');i.alt=b.getAttribute('data-alt');$('p',lb).textContent=b.getAttribute('data-alt');lb.showModal&&lb.showModal()});
 $('.lbx',lb).addEventListener('click',function(){lb.close()});
 lb.addEventListener('click',function(e){if(e.target===lb)lb.close()});
}
/* contact form -> prefilled mail */
var cf=$('#cform');
if(cf)cf.addEventListener('submit',function(e){e.preventDefault();var v=function(n){return cf.elements[n].value};
 var body='Nome: '+v('nome')+'\nEmail: '+v('email')+'\n\n'+v('messaggio');
 location.href='mailto:'+F.email+'?subject='+encodeURIComponent(v('oggetto'))+'&body='+encodeURIComponent(body)});
/* fit check (data: datasheets and Novita on ta-srl.it) */
var box=$('#fit');
if(box){
 var out=$('#fit-out'),mode='turn',TN={I:'ISO',B:'BT',V:'VDI',H:'HSK'};
 var fmt=function(n){return String(Math.round(n*100)/100).replace('.',',')};
 function mail(subject,lines){return 'mailto:'+F.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent('Buongiorno,\nvorrei verificare con voi questa richiesta:\n\n'+lines.join('\n')+'\n\nResto in attesa di un riscontro. Grazie.\n')}
 function reqBtn(subject,lines,label){return '<p class="req"><a class="btn dark" href="'+mail(subject,lines)+'">'+label+'</a><a class="btn ghost-d" href="tel:+390332850167">Oppure chiama 0332 850167</a></p>'}
 function turn(){
  var f=$('[data-form=turn]'),dia=parseFloat(f.dia.value.replace(',','.')),mat=f.mat.value,qty=f.qty.value;
  if(!(dia>0)){out.innerHTML='<div class="res no"><h3>Inserisci il diametro della barra in millimetri.</h3></div>';return}
  var lines=['Tornitura da barra','Diametro barra: '+fmt(dia)+' mm','Materiale: '+mat,'Quantità: '+qty],subj='Verifica tornitura da barra, Ø '+fmt(dia)+' mm';
  var h='';
  if(dia<=F.turn.maxdia){
   h+='<div class="res best"><span class="tag">Rientra</span><h3>'+F.bnj.name+'</h3><p>Passaggio barra diametro '+F.turn.maxdia+' mm: la tua barra da '+fmt(dia)+' mm ci passa. '+F.bnj.text+'</p></div>';
   if(mat==='Altro materiale')h+='<div class="res no"><span class="tag">Da chiedere</span><h3>Materiale diverso da quelli elencati</h3><p>Sul sito TA lavora da barra trafilata in acciaio, inox e speciale, alluminio, bronzo e ottone. Per altri materiali chiedi a TA.</p></div>';
   else h+='<div class="res"><span class="tag">Materiale e serie</span><h3>'+mat+', '+qty.toLowerCase()+'</h3><p>Tra i materiali citati da TA, lavorati dal pezzo singolo alla piccola, media e grande serie.</p></div>';
  }else{
   h+='<div class="res no"><span class="tag">Oltre il passaggio barra</span><h3>'+fmt(dia)+' mm supera i '+F.turn.maxdia+' mm del '+F.bnj.name+'</h3><p>Sul sito non sono elencate altre macchine di tornitura: il parco macchine di TA è più ampio. Scrivi a TA con il disegno e ti dice se si può fare.</p></div>';
  }
  out.innerHTML=h+reqBtn(subj,lines,'Invia la richiesta a TA');
 }
 function preset(){
  var f=$('[data-form=preset]'),dia=parseFloat(f.dia.value.replace(',','.')),h=parseFloat(f.h.value.replace(',','.')),tp=f.taper.value;
  if(!(dia>0)||!(h>0)){out.innerHTML='<div class="res no"><h3>Inserisci diametro e lunghezza dell\'utensile in millimetri.</h3></div>';return}
  var ok=[],no=[];
  F.preset.forEach(function(m){var why=[];if(dia>m.dia)why.push('diametro '+fmt(dia)+' > '+m.dia+' mm');if(h>m.h)why.push('altezza '+fmt(h)+' > '+m.h+' mm');if(tp&&m.t.indexOf(tp)<0)why.push('attacco '+TN[tp]+' non indicato sulla scheda');
   (why.length?no:ok).push({m:m,why:why})});
  ok.sort(function(a,b){return a.m.dia*a.m.h-b.m.dia*b.m.h});
  var lines=['Presetting utensili','Diametro max utensile: '+fmt(dia)+' mm','Lunghezza/altezza utensile: '+fmt(h)+' mm','Attacco: '+(tp?TN[tp]:'non so / altro')],subj='Verifica presetting, utensile Ø '+fmt(dia)+' x '+fmt(h)+' mm';
  var o='';
  if(!ok.length)o+='<div class="res no"><span class="tag">Nessun modello</span><h3>Con queste misure nessun presetting a scheda le copre</h3><p>Il campo più ampio sulle schede è 700 mm di diametro e 600 mm di altezza (EVO 75 e 76). Scrivi a TA: potrebbero esserci soluzioni non pubblicate.</p></div>';
  ok.forEach(function(r,i){var m=r.m,link=m.page?'<a class="l btn dark" href="'+F.base+'/presetting/'+m.page+'/">Scheda</a>':'';
   o+='<div class="res'+(i===0?' best':'')+'" style="animation-delay:'+(i*45)+'ms"><span class="tag">'+(i===0?'Il più vicino alla tua misura':'Rientra')+'</span><h3>'+m.id+'</h3><p>Campo '+m.dia+' mm di diametro, '+m.h+' mm di altezza'+(m.note?' ('+m.note+')':'')+'. Attacchi: '+m.t.split('').map(function(c){return TN[c]}).join(', ')+'.</p>'+link+'</div>'});
  if(no.length)o+='<details><summary>Non rientrano ('+no.length+')</summary><ul>'+no.map(function(r){return '<li><strong>'+r.m.id+'</strong>: '+r.why.join(', ')+'</li>'}).join('')+'</ul></details>';
  out.innerHTML=o+(ok.length?reqBtn(subj,lines.concat(['Modelli che sembrano coprire la misura: '+ok.map(function(r){return r.m.id}).join(', ')]),'Invia la richiesta a TA'):reqBtn(subj,lines,'Scrivi a TA'));
 }
 function run(){mode==='turn'?turn():preset()}
 $$('.seg button',box).forEach(function(b){b.addEventListener('click',function(){mode=b.getAttribute('data-mode');
  $$('.seg button',box).forEach(function(x){x.setAttribute('aria-selected',x===b)});
  $$('[data-form]',box).forEach(function(f){f.hidden=f.getAttribute('data-form')!==mode});run()})});
 $$('form',box).forEach(function(f){f.addEventListener('input',run);f.addEventListener('change',run);f.addEventListener('submit',function(e){e.preventDefault()})});
 run();
}
})();
