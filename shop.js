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
    button.textContent=selected?'Выбрано':owned?'Выбрать':item.price+' 🐟';
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
    row.append(name,button);goods.append(row);
  }
}
window.addEventListener('storage',e=>{if(e.key===saveKey){readProfile();refreshMenu();}});
