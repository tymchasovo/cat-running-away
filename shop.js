'use strict';
const catalog = [
  {group:'Кот', slot:'coat', id:'ginger', name:'Рыжий', price:0},
  {group:'Кот', slot:'coat', id:'tux', name:'Чёрно-белый', price:60},
  {group:'Кот', slot:'coat', id:'grey', name:'Серый', price:60},
  {group:'Аксессуар', slot:'neck', id:'bare', name:'Без косынки', price:0},
  {group:'Аксессуар', slot:'neck', id:'scarf', name:'Красная косынка', price:30},
  {group:'Маршрут', slot:'place', id:'market', name:'Утренний рынок', price:0},
  {group:'Маршрут', slot:'place', id:'pier', name:'Вечерняя набережная', price:120}
];
const saveKey = 'cat-running-away.wallet.v1';
let profile = {balance:0, owned:[], coat:'ginger', neck:'bare', place:'market', music:true, effects:true};
function readProfile(){
  try {
    const stored = JSON.parse(localStorage.getItem(saveKey));
    if(stored && Number.isSafeInteger(stored.balance) && stored.balance>=0 && Array.isArray(stored.owned)){
      Object.assign(profile,stored);
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
  fill(0,0,100,58,item.slot==='place'?sky:'#f1dfb8');
  if(item.slot==='coat'||item.id==='bare'){
    const p=coats[item.slot==='coat'?item.id:profile.coat]||coats.ginger;
    oval(50,56,20,22,p.b);
    shape([[31,27],[29,7],[43,16],[57,16],[71,7],[69,29]],p.x);
    shape([[32,11],[35,25],[42,18]],p.p);shape([[68,11],[65,25],[58,18]],p.p);
    oval(50,30,21,17,p.O);fill(46,14,3,7,p.b);fill(52,14,3,6,p.b);
    oval(41,29,2,3,p.x);oval(59,29,2,3,p.x);
    oval(46,36,6,4,p.tip);oval(54,36,6,4,p.tip);
    shape([[47,33],[53,33],[50,36]],p.p);
  } else if(item.id==='scarf'){
    shape([[17,16],[76,15],[62,30],[42,48]],'#98333a');
    shape([[17,16],[64,21],[43,42]],'#db5247');
    shape([[58,20],[72,12],[78,18],[68,27]],'#c13f44');
    shape([[69,23],[88,28],[79,32],[84,38],[64,28]],'#ae363d');
    fill(28,20,15,2,'#f39372');
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
function refreshMenu(){
  document.getElementById('balance').textContent=profile.balance;
  if(mode==='menu'||mode==='over') document.getElementById('fish').textContent=profile.balance;
  for(const key of ['music','effects']){
    const button=document.getElementById(key);
    button.textContent=(key==='music'?'Музыка':'Эффекты')+(profile[key]?' · вкл':' · выкл');
    button.setAttribute('aria-pressed',String(profile[key]));
  }
  const goods=document.getElementById('goods');
  if(document.getElementById('shop').hidden) return;
  goods.replaceChildren();
  let group='';
  for(const item of catalog){
    if(group!==item.group){
      group=item.group;const heading=document.createElement('h3');heading.textContent=group;goods.append(heading);
    }
    const row=document.createElement('div'), name=document.createElement('span'), button=document.createElement('button');
    row.className='good';name.textContent=item.name;
    const owned=!item.price||profile.owned.includes(item.id), selected=profile[item.slot]===item.id;
    button.textContent=selected?'Выбрано':owned?(item.slot==='place'?'Выбрать маршрут':item.slot==='neck'&&item.id!=='bare'?'Надеть':'Выбрать'):item.price+' 🐟';
    button.disabled=selected||(!owned&&profile.balance<item.price);
    button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-label',item.name+' · '+button.textContent);
    button.onclick=()=>changeProfile(p=>{
      if(item.price&&!p.owned.includes(item.id)){
        if(p.balance<item.price)return;
        p.balance-=item.price;p.owned.push(item.id);
      }
      p[item.slot]=item.id;
    });
    row.append(itemPicture(item),name,button);goods.append(row);
  }
}
window.addEventListener('storage',e=>{if(e.key===saveKey){readProfile();refreshMenu();}});
