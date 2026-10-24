(function(){
  var d=document,root=d.documentElement;root.classList.add('js');
  var hd=d.querySelector('.hd'),burger=d.querySelector('.hd__burger'),nav=d.getElementById('nav');
  function solid(){if(hd.hasAttribute('data-solid'))return;hd.classList.toggle('is-solid',window.scrollY>40||nav.classList.contains('is-open'))}
  solid();window.addEventListener('scroll',solid,{passive:true});
  function setNav(o){nav.classList.toggle('is-open',o);burger.setAttribute('aria-expanded',o?'true':'false');hd.classList.toggle('is-open',o);solid()}
  burger.addEventListener('click',function(){setNav(!nav.classList.contains('is-open'))});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))setNav(false)});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')setNav(false)});
  // reveals
  var els=[].slice.call(d.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.05});
    els.forEach(function(el,i){el.style.transitionDelay=((i%4)*60)+'ms';io.observe(el)});
  }else els.forEach(function(el){el.classList.add('is-in')});
  // dock
  var dock=d.getElementById('dock');
  try{if(sessionStorage.getItem('dockx'))dock.hidden=true}catch(e){}
  dock.querySelector('button').addEventListener('click',function(){dock.hidden=true;try{sessionStorage.setItem('dockx','1')}catch(e){}});
  // finder
  d.querySelectorAll('[data-finder]').forEach(function(f){
    var data=JSON.parse(f.querySelector('#finder-data').textContent);
    var list=f.querySelector('.finder__list'),empty=f.querySelector('.finder__empty'),send=f.querySelector('.finder__send'),btn=f.querySelector('[data-send]');
    var note=f.querySelector('textarea');
    function vals(n){return [].slice.call(f.querySelectorAll('input[name='+n+']:checked')).map(function(i){return i.value})}
    function label(arr,k){return arr.filter(function(x){return k.indexOf(x[0])>-1}).map(function(x){return x[1]})}
    var kindName={machine:'Machine',consumable:'Consumables and wear items',spare:'Spares'};
    var matched=[];
    function run(){
      var mk=vals('mk'),kd=vals('kd');list.innerHTML='';
      if(!mk.length&&!kd.length){empty.hidden=false;send.hidden=true;matched=[];var jj=f.querySelector('.finder__jump');if(jj)jj.hidden=true;return}
      var res=data.lines.map(function(l){
        var a=mk.length?l.mk.filter(function(x){return mk.indexOf(x)>-1}).length:1;
        var b=kd.length?l.kd.filter(function(x){return kd.indexOf(x)>-1}).length:1;
        return {l:l,s:(a&&b)?a*2+b:0};
      }).filter(function(r){return r.s>0}).map(function(r){r.g=r.l.mk.length>=4;return r}).sort(function(x,y){return (x.g-y.g)||(y.s-x.s)});
      matched=res.map(function(r){return r.l});
      empty.hidden=true;
      if(!matched.length){list.innerHTML='<li class="finder__none">No published product line matches both answers. Send us what you need anyway and Protube will come back to you.</li>'}
      var shown=0,sawGen=false;
      res.slice(0,8).forEach(function(r){var l=r.l;
        if(r.g&&!sawGen&&shown){sawGen=true;var h=d.createElement('li');h.className='finder__grp';h.textContent='Also used across most shops';list.appendChild(h)}
        shown++;var li=d.createElement('li'),a=d.createElement('a');a.href=l.u;
        a.innerHTML='<small></small><b></b><span></span>';
        a.children[0].textContent=l.f;a.children[1].textContent=l.t;a.children[2].textContent=l.s;
        li.appendChild(a);list.appendChild(li);
      });
      if(matched.length>8){var li=d.createElement('li');li.className='finder__none';li.style.padding='12px 0';li.textContent='+ '+(matched.length-8)+' more product lines match. They are all in the enquiry.';list.appendChild(li)}
      send.hidden=false;build();
      var jump=f.querySelector('.finder__jump');if(jump){jump.hidden=false;jump.textContent=matched.length+' matching product line'+(matched.length>1?'s':'')+' \u2193'}
    }
    function build(){
      var mk=label(data.makes,vals('mk')),kd=label(data.needs,vals('kd'));
      var lines=matched.slice(0,10).map(function(l){return '- '+l.t}).join('\n');
      var body='Hello Protube,\n\nI run: '+(mk.join(', ')||'(not specified)')+'\nI need: '+(kd.join(', ')||'(not specified)')+
        '\n\nProduct lines that looked right:\n'+(lines||'(none matched)')+'\n\nMy machine / size / material:\n'+(note.value||'')+'\n\nThank you,';
      btn.href='mailto:'+data.email+'?subject='+encodeURIComponent('Enquiry from the Protube website')+'&body='+encodeURIComponent(body);
    }
    f.addEventListener('change',run);note.addEventListener('input',function(){if(matched.length||vals('mk').length||vals('kd').length)build()});
  });
})();
