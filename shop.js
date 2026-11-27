'use strict';
const catalog = [
  {group:'Кот', slot:'coat', id:'ginger', name:'Рыжий', price:0},
  {group:'Кот', slot:'coat', id:'tux', name:'Чёрно-белый', price:60},
  {group:'Кот', slot:'coat', id:'grey', name:'Серый', price:60},
  {group:'Кот', slot:'coat', id:'calico', name:'Трёхцветная', price:60},
  {group:'Кот', slot:'coat', id:'siamese', name:'Сиамская', price:60},
  {group:'Кот', slot:'coat', id:'silver', name:'Серебристая полосатая', price:60},
  {group:'Аксессуары', slot:'neck', id:'bare', name:'Без косынки', price:0},
  {group:'Аксессуары', slot:'neck', id:'scarf', name:'Красная косынка', price:30},
  {group:'Аксессуары', slot:'neck', id:'bow', name:'Зелёная бабочка', price:40},
  {group:'Аксессуары', slot:'neck', id:'dots', name:'Синий платок', price:50},
  {group:'Аксессуары', slot:'neck', id:'winter', name:'Праздничный шарф', price:55},
  {group:'Аксессуары', slot:'hat', id:'none', name:'Без шапки', price:0},
  {group:'Аксессуары', slot:'hat', id:'panama', name:'Жёлтая панама', price:80},
  {group:'Аксессуары', slot:'hat', id:'cap', name:'Новогодний колпачок', price:70},
  {group:'Аксессуары', slot:'hat', id:'beret', name:'Вишнёвый берет', price:70},
  {group:'Аксессуары', slot:'hat', id:'captain', name:'Капитанская фуражка', price:85},
  {group:'Маршрут', slot:'place', id:'market', name:'Утренний рынок', price:0},
  {group:'Маршрут', slot:'place', id:'pier', name:'Вечерняя набережная', price:120},
  {group:'Маршрут', slot:'place', id:'park', name:'Осенний парк', price:200},
  {group:'Маршрут', slot:'place', id:'square', name:'Новогодняя площадь', price:240},
];
const saveKey = 'cat-running-away.wallet.v1';
let profile = {balance:0, owned:[], coat:'ginger', neck:'bare', hat:'none', place:'market', music:true, effects:true};
function readProfile(){
  try {
    const stored = JSON.parse(localStorage.getItem(saveKey));
    if(stored && Number.isSafeInteger(stored.balance) && stored.balance>=0 && Array.isArray(stored.owned)){
      Object.assign(profile,stored);
      if(profile.place==='roofs'||profile.place==='yard')profile.place='market';
    }
  } catch {}
}
readProfile();
function changeProfile(mutate){
  function commit(){
    readProfile();
    mutate(profile);
    try {localStorage.setItem(saveKey,JSON.stringify(profile));} catch {}
    refreshMenu();
  }
  if(navigator.locks) return navigator.locks.request(saveKey,commit);
  commit();
}
function itemPicture(item){
  const art=document.createElement('canvas');
  art.width=100;art.height=58;art.setAttribute('aria-hidden','true');
  const brush=art.getContext('2d');
  function fill(x,y,w,h,color){brush.fillStyle=color;brush.fillRect(x,y,w,h);}
  function shape(vertices,color){
    brush.fillStyle=color;brush.beginPath();
    vertices.forEach(([x,y],i)=>i?brush.lineTo(x,y):brush.moveTo(x,y));
    brush.closePath();brush.fill();
  }
  function oval(x,y,w,h,color){
    brush.fillStyle=color;brush.beginPath();brush.ellipse(x,y,w,h,0,0,Math.PI*2);brush.fill();
  }
  const dark='#48423d', sky=item.id==='pier'?'#686385':'#b7d9bb';
  if(item.slot==='place')fill(0,0,100,58,sky);
  if(item.slot==='coat'||item.id==='bare'||item.id==='none'){
    brush.translate(50,57);brush.scale(.96,.96);
    drawPortrait(brush,item.slot==='coat'?item.id:profile.coat,0);
  } else if(item.id==='scarf'){
    shape([[17,16],[76,15],[62,30],[42,48]],'#98333a');
    shape([[17,16],[64,21],[43,42]],'#db5247');
    shape([[58,20],[72,12],[78,18],[68,27]],'#c13f44');
    shape([[69,23],[88,28],[79,32],[84,38],[64,28]],'#ae363d');
    fill(28,20,15,2,'#f39372');
  } else if(item.slot==='neck'||item.slot==='hat'){
    brush.translate(48,item.slot==='hat'?43:32);brush.scale(1.9,1.9);drawWear(brush,item.id);
  } else if(routes[item.id]){
    const route=routes[item.id];fill(0,0,100,58,route.sky);fill(0,38,100,20,route.ground);
    brush.translate(32,48);brush.scale(.44,.44);drawRouteObject(brush,item.id,'side');brush.translate(90,10);drawRouteObject(brush,item.id,'crate');
  } else if(item.id==='market'){
    fill(0,37,100,21,'#d9aa7a');fill(20,20,4,30,dark);fill(75,20,4,30,dark);
    for(let i=0;i<7;i++)fill(14+i*10,13,10,13,i%2?'#fff0b8':'#c15d42');
    fill(16,38,68,12,'#aa6947');
    for(let i=0;i<8;i++)oval(22+i*8,36-i%2*2,5,4,i%3?'#ed9650':'#7e9859');
  } else {
    oval(74,13,7,7,'#ffdfa6');fill(0,32,100,26,'#516d85');
    shape([[0,25],[40,27],[77,58],[0,58]],'#a38879');
    for(const x of [17,38]){fill(x,13+x/5,2,22,dark);fill(x-2,10+x/5,6,7,'#ffde8d');}
    for(let i=0;i<5;i++)fill(64+i%3*5,36+i*4,14-i*2,1,'#e7b785');
  }
  return art;
}
const notice=document.createElement('div');
notice.className='shop-note';notice.setAttribute('role','status');
let noticeTimer;
function showShortfall(row,missing){
  clearTimeout(noticeTimer);
  const unit=new Intl.PluralRules('ru').select(missing);
  const noun=unit==='one'?'рыбки':'рыбок';
  notice.textContent=Math.random()<.5?'Пока дороговато':'Не хватает '+missing+' '+noun;
  row.append(notice);
  noticeTimer=setTimeout(()=>notice.remove(),1800);
}
const shopCards=new Map();
function refreshMenu(){
  document.getElementById('balance').textContent=profile.balance;
  if(mode==='menu'||mode==='over') document.getElementById('fish').textContent=profile.balance;
  for(const key of ['music','effects']){
    const button=document.getElementById(key);
    button.textContent=(key==='music'?'Музыка':'Эффекты')+(profile[key]?' · вкл':' · выкл');
    button.setAttribute('aria-pressed',String(profile[key]));
  }
  if(mode==='menu'){
    document.getElementById('detail').textContent=routes[profile.place]?.tip || (profile.place==='pier'
      ? 'Перепрыгивай канаты, скользи под каяками и обходи ловушки.'
      : 'Прыгай через ящики, скользи под высокими прилавками и собирай рыбок.');
  }
  const goods=document.getElementById('goods');
  if(document.getElementById('shop').hidden) return;
  const preview=document.getElementById('shop-cat');
  const brush=preview.getContext('2d');
  brush.clearRect(0,0,preview.width,preview.height);
  brush.save();brush.translate(45,76);drawPortrait(brush,profile.coat,0,true);brush.restore();
  let shelf;
  for(const item of catalog){
    let row=shopCards.get(item.id);
    if(!row){
      if(!shelf || shelf.getAttribute('aria-label')!==item.group){
        const heading=document.createElement('h3');heading.textContent=item.group;
        shelf=document.createElement('div');shelf.className='shelf';shelf.tabIndex=0;
        shelf.setAttribute('role','region');shelf.setAttribute('aria-label',item.group);
        goods.append(heading,shelf);
      }
      row=document.createElement('div');row.className='good';
      const name=document.createElement('span');name.textContent=item.name;
      const picture=itemPicture(item);
      if(['neck','hat'].includes(item.slot) && item.price)picture.classList.add(item.slot==='hat'?'hat-tilt':'sway');
      row.append(picture,name,document.createElement('button'));
      shelf.append(row);shopCards.set(item.id,row);
    }else if(item.id==='bare'||item.id==='none'){
      row.firstChild.replaceWith(itemPicture(item));
    }
    const button=row.querySelector('button');
    const owned=!item.price||profile.owned.includes(item.id), selected=profile[item.slot]===item.id;
    button.textContent=selected?'Выбрано':owned?(item.slot==='neck'&&item.id!=='bare'?'Надеть':'Выбрать'):item.price+' 🐟';
    button.disabled=selected;
    const shortfall=!owned && profile.balance<item.price;
    button.classList.toggle('shortfall',shortfall);
    row.onclick=event=>{
      if(shortfall && event.target!==button)button.click();
    };
    button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-label',item.name+' · '+button.textContent);
    button.onclick=()=>changeProfile(p=>{
      if(item.price&&!p.owned.includes(item.id)){
        if(p.balance<item.price){showShortfall(row,item.price-p.balance);return;}
        p.balance-=item.price;p.owned.push(item.id);
      }
      p[item.slot]=item.id;
    });

  }
}
window.addEventListener('storage',e=>{if(e.key===saveKey){readProfile();refreshMenu();}});
