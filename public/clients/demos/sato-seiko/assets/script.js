(function(){
var d=document,h=d.documentElement;h.classList.add('js');
var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,r){return (r||d).querySelector(s)}function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
var dr=$('#drawer'),b=$('#burger'),bx=$('#burger-x');
function tog(o){dr.classList.toggle('is-open',o);dr.setAttribute('aria-hidden',!o);b.setAttribute('aria-expanded',o);d.body.style.overflow=o?'hidden':'';if(o)bx.focus();else b.focus()}
if(b){b.onclick=function(){tog(true)};bx.onclick=function(){tog(false)};d.addEventListener('keydown',function(e){if(e.key==='Escape'&&dr.classList.contains('is-open'))tog(false)});$$('a',dr).forEach(function(a){a.addEventListener('click',function(){tog(false)})})}
var dk=$('#dock');try{if(sessionStorage.getItem('dk'))dk.classList.add('gone')}catch(e){}
$('#dock-x').onclick=function(){dk.classList.add('gone');try{sessionStorage.setItem('dk','1')}catch(e){}};
var rv=$$('.rv');
if(rm||!('IntersectionObserver' in window)){rv.forEach(function(x){x.classList.add('in')})}else{
 var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.05});rv.forEach(function(x){io.observe(x)});
 setTimeout(function(){rv.forEach(function(x){if(x.getBoundingClientRect().top<innerHeight)x.classList.add('in')})},50)}
if(!rm&&'IntersectionObserver' in window){$$('[data-count]').forEach(function(el){var t=el.getAttribute('data-count');if(!/^\d+$/.test(t))return;var n=+t,u=el.querySelector('small');var iu=u?u.outerHTML:'';
 var co=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;co.disconnect();var s=null;function f(ts){s=s||ts;var p=Math.min(1,(ts-s)/1100),v=Math.round(n*(1-Math.pow(1-p,3)));el.innerHTML=v+iu;if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)},{threshold:.6});co.observe(el)})}
var ml=$('#map-load');if(ml){ml.onclick=function(){var m=$('#map'),i=d.createElement('iframe');i.src=m.getAttribute('data-embed');i.title='佐藤精工株式会社の地図';i.loading='lazy';m.innerHTML='';m.appendChild(i)}}
$$('[data-tool]').forEach(function(root){
 var D=JSON.parse($('#tool-data',root).textContent),out=$('.tool__out',root);
 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function val(n){var c=$('input[name='+n+']:checked',root);return c?c.value:null}
 function lab(list,k){for(var i=0;i<list.length;i++)if(list[i][0]===k)return list[i][1];return''}
 function render(){var p=val('part'),q=val('qty');if(!p&&!q)return;
  var ids=[],why={};if(p){ids.push(p);why[p]='選んだ部品：'+lab(D.parts,p)}
  var qs=q?D.qmap[q]:null;if(qs&&ids.indexOf(qs)<0){ids.push(qs);why[qs]='数の目安：'+lab(D.qty,q)}
  if(!ids.length){out.innerHTML='<p class="tool__hint">量産型については、部品の種類を選ぶと近い事業内容をご案内します。</p>';return}
  var h='<div class="res">'+ids.map(function(id){var s=D.sv[id];return '<article><p class="why">'+esc(why[id])+'</p><h3>'+esc(s.name)+'</h3><p>'+esc(s.body)+'</p>'+(s.strong?'<p><b>'+esc(s.strong)+'</b></p>':'')+'<a class="inl" href="'+D.base+'/business/'+id+'/">この事業内容のページを見る</a></article>'}).join('')+'</div>';
  var names=ids.map(function(id){return D.sv[id].name}).join('、');
  var body='佐藤精工株式会社 ご担当者様\n\n金型についてご相談があります。\n\n【ご相談の内容】\n・部品：'+(p?lab(D.parts,p):'未選択')+'\n・数の目安：'+(q?lab(D.qty,q):'未選択')+'\n・近い事業内容：'+names+'\n\n会社名：\nご担当者名：\n電話番号：\n部品の用途・材質・ご希望の納期：\n';
  var href='mailto:'+D.mail+'?subject='+encodeURIComponent('【ご相談】'+names+'について')+'&body='+encodeURIComponent(body);
  h+='<div class="res__act"><a class="btn" href="'+href+'" data-ev="email">この内容でメール相談</a><a class="btn btn--ghost" href="'+D.telh+'" data-ev="call">電話 '+esc(D.tel)+'</a></div><p class="note">公式サイトの事業内容にもとづく目安です。仕様・費用・納期は個別にご確認ください。</p>';
  out.innerHTML=h}
 root.addEventListener('change',render)});
})();
