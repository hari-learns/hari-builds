(function(){
var F={"preset": [{"id": "Evo 33", "dia": 320, "h": 360, "t": "IBVH", "page": "evo"}, {"id": "Evo 35", "dia": 320, "h": 500, "t": "IBVH", "page": "evo"}, {"id": "Evo 36", "dia": 320, "h": 600, "t": "IBVH", "page": "evo"}, {"id": "Evo 53", "dia": 520, "h": 360, "t": "IBVH", "page": "evo"}, {"id": "Evo 55", "dia": 520, "h": 500, "t": "IBVH", "page": "evo"}, {"id": "Evo 75", "dia": 700, "h": 500, "t": "IBVH", "page": "evo"}, {"id": "Evo 76", "dia": 700, "h": 600, "t": "IBVH", "page": "evo"}, {"id": "ASTRID", "dia": 400, "h": 400, "t": "IVH", "page": "astrid", "note": "X axis 400 mm, Z axis 400 mm from the datasheet"}, {"id": "GA 400", "dia": 400, "h": 400, "t": "IVH", "page": "ga400"}, {"id": "LOREL 320", "dia": 200, "h": 320, "t": "IVH", "page": "lorel-320"}, {"id": "T718", "dia": 600, "h": 600, "t": "IBVH", "page": null, "note": "family with several sizes, from 250 to 600 mm in diameter and from 300 to 600 mm in height, from the News section 2015"}], "turn": {"maxdia": 50, "machine": "Citizen Miyano BNJ 51 SY6", "materials": ["Steel", "Stainless and special steel", "Aluminium", "Bronze", "Brass", "Other material"]}, "email": "info@ta-srl.it", "bnj": {"name": "Citizen Miyano BNJ 51 SY6", "text": "Twin-spindle lathe, bar capacity diameter 50 mm, 2 turrets and Y axis, combined with the TOP AUTOMAZIONI mod. FUSION bar feeder.", "story": "In 2018 the Citizen BNJ 51 joined the company: a great leap in quality, which makes it possible to work from small and medium to large series. The company also works from the single piece, starting only from the drawing and arriving at the final production solution."}, "base": "/clients/demos/ta-srl/en", "pages": {"evo": "EVO", "astrid": "ASTRID", "ga400": "GA 400", "lorel-320": "LOREL 320"}}, d=document, $=function(s,r){return (r||d).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* dock */
var dock=$('#dock');try{if(sessionStorage.getItem('dockx'))dock.hidden=true}catch(e){}
$('#dockx').addEventListener('click',function(){dock.hidden=true;try{sessionStorage.setItem('dockx','1')}catch(e){}});
/* menu */
var bg=$('#burger'),nav=$('#nav');
function setMenu(o){if(o){var hb=$('.top').getBoundingClientRect().bottom;nav.style.top=Math.max(0,hb)+'px'}nav.classList.toggle('open',o);bg.setAttribute('aria-expanded',o);bg.setAttribute('aria-label',o?'Close the menu':'Open the menu');d.body.style.overflow=o?'hidden':''}
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
 var fmt=function(n){return String(Math.round(n*100)/100)};
 function mail(subject,lines){return 'mailto:'+F.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent('Hello,\nI would like to check this request with you:\n\n'+lines.join('\n')+'\n\nI look forward to your reply. Thank you.\n')}
 function reqBtn(subject,lines,label){return '<p class="req"><a class="btn dark" href="'+mail(subject,lines)+'">'+label+'</a><a class="btn ghost-d" href="tel:+390332850167">Or call +39 0332 850167</a></p>'}
 function turn(){
  var f=$('[data-form=turn]'),dia=parseFloat(f.dia.value.replace(',','.')),mat=f.mat.value,qty=f.qty.value;
  if(!(dia>0)){out.innerHTML='<div class="res no"><h3>Enter the bar diameter in millimetres.</h3></div>';return}
  var lines=['Bar turning','Bar diameter: '+fmt(dia)+' mm','Material: '+mat,'Quantity: '+qty],subj='Bar turning check, Ø '+fmt(dia)+' mm';
  var h='';
  if(dia<=F.turn.maxdia){
   h+='<div class="res best"><span class="tag">Fits</span><h3>'+F.bnj.name+'</h3><p>Bar capacity diameter '+F.turn.maxdia+' mm: your '+fmt(dia)+' mm bar fits. '+F.bnj.text+'</p></div>';
   if(mat==='Other material')h+='<div class="res no"><span class="tag">To ask</span><h3>A material other than those listed</h3><p>On the TA site, work is done from drawn bar in steel, stainless and special steel, aluminium, bronze and brass. For other materials, ask TA.</p></div>';
   else h+='<div class="res"><span class="tag">Material and series</span><h3>'+mat+', '+qty.toLowerCase()+'</h3><p>The TA site lists this material among those machined from bar, with work from the single piece to small, medium and large series.</p></div>';
  }else{
   h+='<div class="res no"><span class="tag">Beyond the bar capacity</span><h3>'+fmt(dia)+' mm exceeds the '+F.turn.maxdia+' mm of the '+F.bnj.name+'</h3><p>The site does not list other turning machines (the machine park is «very large», from the traditional machine to the high-technology one). Write to TA with your drawing.</p></div>';
  }
  out.innerHTML=h+reqBtn(subj,lines,'Send the request to TA');
 }
 function preset(){
  var f=$('[data-form=preset]'),dia=parseFloat(f.dia.value.replace(',','.')),h=parseFloat(f.h.value.replace(',','.')),tp=f.taper.value;
  if(!(dia>0)||!(h>0)){out.innerHTML='<div class="res no"><h3>Enter the tool diameter and length in millimetres.</h3></div>';return}
  var ok=[],no=[];
  F.preset.forEach(function(m){var why=[];if(dia>m.dia)why.push('diameter '+fmt(dia)+' > '+m.dia+' mm');if(h>m.h)why.push('height '+fmt(h)+' > '+m.h+' mm');if(tp&&m.t.indexOf(tp)<0)why.push('taper '+TN[tp]+' not listed on the datasheet');
   (why.length?no:ok).push({m:m,why:why})});
  ok.sort(function(a,b){return a.m.dia*a.m.h-b.m.dia*b.m.h});
  var lines=['Tool presetting','Max tool diameter: '+fmt(dia)+' mm','Tool length/height: '+fmt(h)+' mm','Taper: '+(tp?TN[tp]:'not sure / other')],subj='Presetting check, tool Ø '+fmt(dia)+' x '+fmt(h)+' mm';
  var o='';
  if(!ok.length)o+='<div class="res no"><span class="tag">No model</span><h3>With these measurements no tool presetting on the datasheets covers them</h3><p>The widest range on the datasheets is 700 mm in diameter and 600 mm in height (EVO 75 and 76). Write to TA with your measurements.</p></div>';
  ok.forEach(function(r,i){var m=r.m,link=m.page?'<a class="l btn dark" href="'+F.base+'/presetting/'+m.page+'/">Datasheet</a>':'';
   o+='<div class="res'+(i===0?' best':'')+'" style="animation-delay:'+(i*45)+'ms"><span class="tag">'+(i===0?'The most compact that covers your measurement':'Fits')+'</span><h3>'+m.id+'</h3><p>Range '+m.dia+' mm in diameter, '+m.h+' mm in height'+(m.note?' ('+m.note+')':'')+'. Tapers: '+m.t.split('').map(function(c){return TN[c]}).join(', ')+'.</p>'+link+'</div>'});
  if(no.length)o+='<details><summary>Do not fit ('+no.length+')</summary><ul>'+no.map(function(r){return '<li><strong>'+r.m.id+'</strong>: '+r.why.join(', ')+'</li>'}).join('')+'</ul></details>';
  out.innerHTML=o+(ok.length?reqBtn(subj,lines.concat(['Models that appear to cover the measurement: '+ok.map(function(r){return r.m.id}).join(', ')]),'Send the request to TA'):reqBtn(subj,lines,'Write to TA'));
 }
 function run(){mode==='turn'?turn():preset()}
 $$('.seg button',box).forEach(function(b){b.addEventListener('click',function(){mode=b.getAttribute('data-mode');
  $$('.seg button',box).forEach(function(x){x.setAttribute('aria-selected',x===b)});
  $$('[data-form]',box).forEach(function(f){f.hidden=f.getAttribute('data-form')!==mode});run()})});
 $$('form',box).forEach(function(f){f.addEventListener('input',run);f.addEventListener('change',run);f.addEventListener('submit',function(e){e.preventDefault()})});
 run();
}
})();
