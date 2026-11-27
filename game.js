'use strict';
const canvas = document.querySelector('main > canvas');
const ctx = canvas.getContext('2d');
const el = id => document.getElementById(id);
const panel = el('panel'), hint = el('hint');
let best = 0;
try { best = Number(localStorage.getItem('cat-running-away.best')) || 0; } catch {}
el('best').textContent = best;
let mode = 'menu', distance = 0, fish = 0, lane = 0, x = 0, air = 0;
let elapsed = 0, nextRow = 0, objects = [], last = 0, pointer = null;
let W, H, slide = 0, diving = false;
let pausedFrom = '', bonusLeft = 0, nextTrail = 0, nextGold = 0;
let magnetLeft=0, nextRod=0;
let mintLeft=0, nextMint=0, waiting=false;
const durations={gold:8,rod:6,mint:4};
const meters={};
for(const [type,label,color] of [['gold','Золотая рыбка','#e9a129'],['rod','Удочка','#459599'],['mint','Кошачья мята','#559361']]){
  const row=document.createElement('div'),icon=document.createElement('canvas'),bar=document.createElement('progress');
  row.className='power-meter';row.hidden=true;row.style.setProperty('--fill',color);
  icon.width=icon.height=56;icon.setAttribute('aria-hidden','true');
  const brush=icon.getContext('2d');brush.translate(28,53);brush.scale(1.12,1.12);drawPowerup(brush,type);
  bar.max=durations[type];bar.setAttribute('aria-label',label);row.append(icon,bar);el('bonus').append(row);
  meters[type]={row,bar};
}
function updateMeter(type,left){
  meters[type].row.hidden=left<=0;
  meters[type].bar.value=left;
}
let attempted = false;
const tutorialKey = 'cat-running-away.started';
function firstAttempt(){
  try {
    attempted ||= localStorage.getItem(tutorialKey)==='1' || best>0;
    localStorage.setItem(tutorialKey,'1');
  } catch {}
  const first=!attempted;
  attempted=true;
  return first;
}
function pauseGame(){
  if(mode!=='run' && mode!=='intro') return;
  pausedFrom=mode;
  mode='paused';pointer=null;soundtrack.silence();
  el('pause').hidden=true;el('break').hidden=false;
  el('pause-title').textContent='Пауза';el('resume').hidden=false;
}
el('pause').onclick=pauseGame;
el('resume').onclick=()=>{
  if(mode!=='paused')return;
  mode=pausedFrom;last=performance.now();soundtrack.unlock();
  el('break').hidden=true;el('pause').hidden=false;
};
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseGame();soundtrack.silence();}});
window.addEventListener('pagehide',()=>{pauseGame();soundtrack.silence();});
for(const event of ['pointerup','keydown']) document.addEventListener(event,soundtrack.unlock);
for(const event of ['gesturestart','gesturechange']){
  document.addEventListener(event,e=>e.preventDefault(),{passive:false});
}
document.addEventListener('touchmove',e=>{
  if(e.touches.length>1 || !el('goods').contains(e.target))e.preventDefault();
},{passive:false});
document.addEventListener('wheel',e=>{
  if(e.ctrlKey || !el('goods').contains(e.target))e.preventDefault();
},{passive:false});
let introTime = 0, playedIntro = false, lesson = '';
const firstCrate = 28, firstStall = 58, firstTable = 82, introDuration = 2.65;
function addCrate(at, lane) {
  objects.push({at, lane, type:'crate'});
  for (const offset of [-1.5, 0, 1.5]) {
    objects.push({at:at+offset, lane, type:'fish', rise:offset === 0 ? 58 : 38});
  }
}
function resize() {
  W = canvas.clientWidth; H = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * ratio; canvas.height = H * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function start() {
  mode = playedIntro || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'run' : 'intro';
  soundtrack.start(); slide=0; diving=false; el('fish').textContent=0;
  playedIntro = true; introTime = 0; pointer = null;
  distance = fish = lane = x = air = elapsed = 0;
  lesson = firstAttempt() ? 'jump' : ''; objects = [];
  waiting=false;mintLeft=0;nextMint=(lesson?110:60)+Math.random()*40;
  magnetLeft=0; nextRod=100+Math.random()*60; bonusLeft=0; nextGold=lesson?110:30; el('bonus').hidden=true;
  el('pause').hidden=false;
  if(lesson){
  addCrate(firstCrate, 0);
  objects.push({at:firstStall, lane:0, type:'stall'});
  for(const tableLane of [-1,0,1]) objects.push({at:firstTable,lane:tableLane,type:'table'});
  }
  nextRow = lesson ? 104 : 24; panel.hidden = true; hint.hidden = true; el('score').textContent = '0';
  last = performance.now();
}
function action(dir) {
  if (mode !== 'run') return;
  if(dir==='up'){
    if(!air){slide=0;air=.86;}
  }else if(dir==='down'){
    if(air){
      // Mirror the rising arc onto its descending half at the same height.
      air=Math.min(air,.86-air);diving=air>0;
      if(!diving)slide=.8;
    }else if(!slide)slide=.8;
  }
  else lane = Math.max(-1, Math.min(1, lane + dir));
}
el('start').onclick = start;
el('open-shop').onclick=()=>{waiting=mode==='over';panel.hidden=true;el('shop').hidden=false;refreshMenu();};
el('close-shop').onclick=()=>{el('shop').hidden=true;panel.hidden=false;};
for(const key of ['music','effects']) el(key).onclick=()=>changeProfile(p=>{p[key]=!p[key];if(key==='music'&&!p.music)soundtrack.silence();soundtrack.unlock();});
refreshMenu();
canvas.onpointerdown = e => {
  if (!e.isPrimary) return;
  canvas.setPointerCapture(e.pointerId); pointer = [e.clientX,e.clientY];
};
function swipe(e) {
  if (!pointer || !e.isPrimary) return;
  const dx = e.clientX-pointer[0], dy = e.clientY-pointer[1];
  if (Math.max(Math.abs(dx),Math.abs(dy)) < 18) return;
  pointer = null;
  if (Math.abs(dx)>Math.abs(dy)) action(Math.sign(dx));
  else action(dy<0?'up':'down');
}
canvas.onpointermove = swipe;
canvas.onpointerup = e => { swipe(e); pointer=null; };
canvas.onpointercancel = () => { pointer=null; };
window.onkeydown = e => {
  if(e.key==='Escape' && !e.repeat){pauseGame();return;}
  const keys = {ArrowLeft:-1,ArrowRight:1,ArrowUp:'up',ArrowDown:'down',' ':'up'};
  if (mode==='run' && e.key in keys) {e.preventDefault(); if(!e.repeat) action(keys[e.key]);}
};
const height = () => Math.sin(Math.PI*air/.86);
const points = () => Math.floor(distance)+10*fish;
function finish() {
  soundtrack.silence();soundtrack.impact();el('bonus').hidden=true;el('pause').hidden=true;
  mode='over'; hint.hidden=true; panel.hidden=false;
  best = Math.max(points(),best);
  try { localStorage.setItem('cat-running-away.best',best); } catch {}
  el('best').textContent=best;
  panel.querySelector('h1').innerHTML='Забег<br><em>окончен</em>';
  el('detail').textContent=points()+' очк. · '+Math.floor(distance)+' м · 🐟 '+fish;
  el('start-label').textContent='Ещё раз';
  refreshMenu();
}
function spawnSchool(start){
  const count=6+Math.floor(Math.random()*5);
  let at=start;
  for(let i=0;i<count;i++){
    const free=[-1,0,1].filter(l=>!objects.some(o=>o.lane===l && Math.abs(o.at-at)<1.7));
    if(free.length)objects.push({at,lane:free[Math.floor(Math.random()*free.length)],type:'fish',bonus:true});
    at+=.8+Math.random()*1.6;
  }
  return at+2+Math.random()*8;
}
function tick(dt) {
  const ramp=Math.max(0,Math.min(1,(durations.mint-mintLeft)/.35,mintLeft/.35));
  const speed=Math.min(17,8+elapsed*.15)*(1+.2*ramp);
  mintLeft=Math.max(0,mintLeft-dt);
  let advance = speed*dt;
  if (lesson) {
    const jumping = lesson === 'jump';
    const sliding = lesson === 'slide';
    const cue = jumping ? firstCrate-3.6 : sliding ? firstTable-3 : firstStall-4;
    if (distance+advance >= cue) {
      if (sliding ? slide >= .46 : lane !== 0 || (jumping && air >= .60)) {
        lesson = jumping ? 'dodge' : sliding ? '' : 'slide';
        hint.hidden = true;
      } else {
        advance = Math.max(0, cue-distance);
        hint.textContent = jumping ? '↑  Смахни вверх' : sliding ? '↓  Проскользни под прилавком' : '↔  Смахни в сторону';
        hint.hidden = false;
      }
    }
  }
  elapsed += advance/speed; distance += advance;
  x += Math.sign(lane-x)*Math.min(Math.abs(lane-x),dt*7);
  slide=Math.max(0,slide-dt);
  air=Math.max(0,air-dt*(diving?4:1));
  if(diving && !air){slide=.8;diving=false;}
  while(nextRow < distance+90) {
    const blocked=Math.floor(Math.random()*3)-1;
    const open=(blocked+2)%3-1;
    const roll=Math.random();
    const type=roll<.38?'crate':roll<.58?'table':roll<.76?'lowTable':'stall';
    if(type==='crate') addCrate(nextRow,blocked);
    else {
      objects.push({at:nextRow,lane:blocked,type});
      objects.push({at:nextRow,lane:open,type:'fish'});
    }
    if(nextRow>185 && Math.random()<.65) objects.push({at:nextRow,lane:-blocked-open,type:'stall'});
    if(nextRow>=nextGold){
      objects.push({at:nextRow-5,lane:open,type:'gold'});
      nextGold=nextRow+155+Math.random()*55;
    }
    if(nextRow>=nextMint){
      objects.push({at:nextRow-9,lane:open,type:'mint'});
      nextMint=nextRow+160+Math.random()*100;
    }
    nextRow+=nextRow<185?24:17+Math.random()*7;
  }
  if(nextRod<distance+82){
    const free=[-1,0,1].filter(l=>!objects.some(o=>o.lane===l && Math.abs(o.at-nextRod)<3));
    if(free.length){
      objects.push({at:nextRod,lane:free[Math.floor(Math.random()*free.length)],type:'rod'});
      nextRod+=220+Math.random()*140;
    }else nextRod+=3;
  }
  if(bonusLeft>0){
    bonusLeft=Math.max(0,bonusLeft-dt);
    if(!bonusLeft)objects=objects.filter(o=>!o.bonus && !o.pulling);
    else if(nextTrail<distance+30)nextTrail=spawnSchool(nextTrail);
  }
  magnetLeft=Math.max(0,magnetLeft-dt);
  for(const o of objects) {
    if(o.done)continue;
    if(o.type==='fish' && magnetLeft>0 && o.at>=distance && o.at-distance<16)o.pulling=true;
    if(o.pulling){
      o.lane+=(x-o.lane)*Math.min(1,dt*9);
      o.at-=dt*22;
      o.rise=(o.rise||14)*(1-dt*5)+height()*55*dt*5;
    }
    if(o.at>distance)continue;
    o.done=true;
    if(!o.pulling && Math.abs(o.lane-x)>.48) continue;
    if(o.type==='gold'){
      bonusLeft=durations.gold;nextTrail=spawnSchool(distance+6);
      soundtrack.fish();
    } else if(o.type==='rod'){
      magnetLeft=durations.rod;soundtrack.fish();
    } else if(o.type==='mint'){
      mintLeft=durations.mint;soundtrack.fish();
    } else if(o.type==='fish') {
      if(o.pulling || (o.rise?height()>.35:height()<.65)){
        fish++; el('fish').textContent=fish;
        soundtrack.fish(); changeProfile(p=>{p.balance++;});
      }
    }
    else {
      const cleared=(o.type==='crate' || o.type==='lowTable') && height()>=.35
        || (o.type==='table' || o.type==='lowTable') && slide>0;
      if(!cleared){finish();break;}
    }
  }
  objects=objects.filter(o=>o.at>distance-6 && !((['fish','gold','rod','mint'].includes(o.type)) && o.done));
  updateMeter('gold',bonusLeft);updateMeter('rod',magnetLeft);updateMeter('mint',mintLeft);
  el('bonus').hidden=mode!=='run'||!(bonusLeft||magnetLeft||mintLeft);
  el('score').textContent=points();

}
// All scenery is drawn in world order, from the far market gate to the cat.
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();}
function oval(x,y,a,b,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,a,b,0,0,Math.PI*2);ctx.fill();}
function project(z,lane){
  const scale=15/(15+z);
  return {x:W*(.5+lane*.255*scale),y:H*(.27+.54*scale),s:W/410*scale};
}
function booth(color){
  rect(-37,-80,5,79,'#795441');rect(31,-80,5,79,'#795441');
  rect(-40,-33,81,31,'#a85e3e');rect(-36,-27,73,4,'#d99158');
  for(let i=0;i<9;i++) oval(-32+i*8,-34-(i%2)*3,6,5,i%3?'#ec9a44':'#819447');
  for(let i=0;i<8;i++){
    const left=-40+i*10;
    poly([[left*.78,-89],[(left+10)*.78,-89],[left+10,-68],[left,-68]],i%2?'#ffde9c':color);
    rect(left,-68,10,7,i%2?'#f2ca87':color);
  }
}
function ropeCoil(){
  oval(0,-3,30,5,'#896d68');
  for(let layer=0;layer<3;layer++){
    const y=-6-layer*4;
    oval(-4,y,23-layer,7,'#72523d');
    oval(-4,y-1,20-layer,5,'#dbad69');
    oval(-4,y-1,11-layer,2.5,'#8d6948');
  }
  oval(17,-14,8,10,'#ba502f');oval(16,-16,7,8,'#f18c43');
  rect(11,-17,11,3,'#fff1c5');
}
function kayakRack(){
  rect(-35,-52,7,52,'#574d50');rect(28,-52,7,52,'#574d50');
  rect(-39,-53,78,6,'#ba8d67');
  poly([[-46,-69],[-32,-66],[-18,-69],[19,-69],[33,-66],[46,-72],[38,-57],[23,-53],[-22,-53],[-37,-57]],'#315966');
  poly([[-45,-69],[-22,-66],[19,-67],[46,-72],[38,-61],[20,-58],[-24,-58],[-38,-61]],'#f49a5b');
  oval(0,-66,13,3,'#343f4a');rect(-28,-63,3,8,'#624d43');rect(25,-64,3,8,'#624d43');
}
function crabPots(){
  const net='#526a68', rim='#c2a979';
  for(const [left,top] of [[-32,-27],[0,-27],[-17,-55]]){
    rect(left,top,33,27,net);
    for(let i=4;i<32;i+=7)rect(left+i,top,1.5,26,'#9ca99a');
    for(let i=6;i<26;i+=7)rect(left,top+i,32,1.5,'#9ca99a');
    rect(left,top,33,3,rim);rect(left,top+24,33,3,rim);
    oval(left+15,top+13,6,4,'#3c5154');
  }
  rect(5,-59,2,12,'#e6c995');oval(6,-48,4,7,'#e97749');
  rect(-2,-61,2,9,'#e6c995');oval(-1,-52,4,6,'#edc258');
}
const sprite=[
'    xx       xx    ','   xOOx     xOOx   ','   xOpOxxxxxOpOx   ','   xOOOObbbOOOox   ',
'  xOOOOObObOOOOOx  ','  xOOOOOOOOOOOOOx  ','   xOOOOOOOOOOOx   ','    xbbbbbbbbbx    ',
'     xOOOOOOOx     ','    xOOObbbOOOx    ','    xOOOOOOOOOx    ','    xOOObbbOOOx    ',
'     xOOOOOOOx     ','      xxxxxxx      '];
const coats={
  ginger:{x:'#654135',O:'#f29b46',b:'#bf592e',p:'#efac85',o:'#e18741',tip:'#f4a458'},
  tux:{x:'#21242b',O:'#333641',b:'#fff3d7',p:'#e7a4a3',o:'#e7e3ce',tip:'#fff5de'},
  grey:{x:'#454451',O:'#a3a4b1',b:'#636776',p:'#e2a4ac',o:'#828695',tip:'#ccd0d3'}
};
function wear(neckY,hatY,beat){
  for(const [id,y] of [[profile.neck,neckY],[profile.hat,hatY]]){
    ctx.save();ctx.translate(0,y);drawWear(ctx,id,beat);ctx.restore();
  }
}
function heldRod(palette,beat){
  if(magnetLeft<=0)return;
  ctx.save();ctx.translate(13,slide>0?-12:-20);ctx.rotate(slide>0?.73:.15);
  ctx.strokeStyle='#533b34';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-2,6);
  ctx.quadraticCurveTo(5,-28,18,-48+beat);ctx.stroke();
  const bob=18+beat*2;
  ctx.strokeStyle='#e1edde';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(18,-48+beat);
  ctx.lineTo(bob,-32+beat);ctx.stroke();
  oval(bob,-31+beat,2,3,'#e65b48');oval(-1,0,4,3,palette.tip);ctx.restore();
}
function cat(cx,cy,s,time){
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  const beat=Math.sin(time*12+(mintLeft>0?(durations.mint-mintLeft)*Math.PI*2:0));
  if(mintLeft>0){
    for(let i=0;i<4;i++){
      const drift=(time*1.8+i/4)%1,side=i%2?1:-1;
      const lx=side*(14+drift*17),ly=-10+drift*19;
      poly([[lx,ly],[lx+side*5,ly-4],[lx+side*4,ly],[lx,ly+2]],'#458858');
    }
  }
  const palette=coats[profile.coat]||coats.ginger;
  if(slide>0){
    // Fold the limbs and move the head forward without scaling the standing sprite.
    const tuck=Math.min(1,slide/.10,(.8-slide)/.10);
    ctx.translate(0,-3*(1-tuck));
    for(const side of [-1,1]){
      oval(12*side,-5,6,4,palette.x);oval(12*side,-6,5,3,palette.b);
    }
    oval(0,-12,15,12,palette.x);oval(0,-13,13,10,palette.O);
    oval(0,-22,15,10,palette.x);oval(0,-22,14,9,palette.O);
    for(const side of [-1,1]){
      poly([[side*8,-27],[side*17,-28-4*(1-tuck)],[side*14,-21]],palette.b);
    }
    rect(-4,-29,3,5,palette.b);rect(2,-29,3,4,palette.b);
    wear(-17,-29,beat);
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1,-8);ctx.quadraticCurveTo(8,2,23+beat*2,1);
    ctx.strokeStyle=palette.x;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle=palette.O;ctx.lineWidth=4;ctx.stroke();
    oval(23+beat*2,1,3,2.5,palette.tip);
    heldRod(palette,beat);ctx.restore();return;
  }
  rect(-13,-9+beat*3,9,9,palette.b);rect(4,-9-beat*3,9,9,palette.b);
  sprite.forEach((row,j)=>[...row].forEach((v,i)=>{if(palette[v])rect((i-9.5)*3,(j-15)*3,3.15,3.15,palette[v]);}));
  if(mintLeft>durations.mint-.4){
    const twitch=Math.sin((durations.mint-mintLeft)*Math.PI/.4)*4;
    for(const side of [-1,1])poly([[side*11,-38],[side*(17+twitch),-44+twitch],[side*18,-34]],palette.O);
  }
  ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1,-10);ctx.quadraticCurveTo(16,-4,20+beat*3,-21);
  ctx.strokeStyle=palette.x;ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle=palette.O;ctx.lineWidth=5;ctx.stroke();
  oval(20+beat*3,-21,3.2,3.8,palette.tip);
  wear(-23,-41,beat);heldRod(palette,beat);
  ctx.restore();
}
function sittingCat(time){
  const p=coats[profile.coat]||coats.ginger;
  ctx.save();ctx.translate(W*.5,H*.94);
  const size=Math.min(W/175,H/270);ctx.scale(size,size);
  const phase=time%4.8;
  const lift=Math.max(0,Math.min(1,(phase-1.4)*4,(3-phase)*4));
  const rub=Math.sin(phase*23)*lift;
  oval(0,0,26,5,'#9c806a');oval(13,-4,15,4,p.b);
  oval(0,-15,17,17,p.b);oval(0,-15,11,14,p.O);
  oval(-10,-2,7,4,p.tip);oval(10,-2,7,4,p.tip);
  poly([[-17,-37],[-23,-45],[-7,-42]],p.O);
  poly([[6,-41],[17,-51],[18,-35]],p.O);
  oval(0,-34,19,15,p.O);
  for(const side of [-1,1]){
    oval(side*8,-34,2,2.5,p.x);
    poly([[side*4,-39],[side*12,-36],[side*12,-38],[side*4,-41]],p.b);
    oval(side*4,-28,5,3,p.tip);
  }
  poly([[-3,-30],[3,-30],[0,-27]],p.x);
  wear(-21,-45,Math.sin(time*2)*.25);
  const pawX=11+8*lift,pawY=-7-33*lift+2*rub;
  ctx.lineWidth=5;ctx.lineCap='round';ctx.strokeStyle=p.b;ctx.beginPath();
  ctx.moveTo(12,-15);ctx.quadraticCurveTo(22,-12-12*lift,pawX,pawY);ctx.stroke();
  oval(pawX,pawY,4,4,p.tip);
  ctx.restore();
}
function drawFish(x,y){
  poly([[x-10,y],[x-18,y-7],[x-18,y+7]],'#245963');
  oval(x,y,12,7,'#42aaa9');oval(x+5,y-2,1.7,1.7,'#173e44');
}
function drawTheft(){
  // A side-on shot cuts to the running camera when the cat leaves the stall.
  const t=introTime, p=coats[profile.coat]||coats.ginger;
  const dusk=profile.place==='pier';
  rect(0,0,W,H,dusk?'#545678':'#f5c99b');
  ctx.save();ctx.translate(W*.5,H*.67);const scale=Math.min(W/340,H/400);ctx.scale(scale,scale);
  rect(-220,-210,440,125,dusk?'#364364':'#dfac83');
  for(let i=-5;i<=5;i++)rect(i*43,-204,19,53,dusk?'#edc788':'#97b8aa');
  rect(-200,-89,400,150,'#bb8d69');
  for(let i=0;i<9;i++)rect(4+i*18,-154,18,15,i%2?'#ffe4ab':'#be5747');
  rect(21,-55,139,11,'#694f46');rect(29,-44,10,48,'#866047');rect(142,-44,10,48,'#866047');
  const rise=Math.min(1,Math.max(0,(t-.4)/.55)), flee=Math.min(1,Math.max(0,(t-1.48)/.88));
  const cx=-32-210*flee*flee, headY=-33-rise*20;
  ctx.save();ctx.translate(cx,-4*Math.abs(Math.sin(flee*12)));
  oval(0,0,29,5,'#9d7960');
  oval(-3,-21,20,22,p.O);oval(4,headY,20,16,p.O);
  poly([[-12,headY-8],[-10,headY-26],[-1,headY-15]],p.x);
  poly([[3,headY-14],[11,headY-26],[14,headY-9]],p.O);
  oval(t<.42?5:13,headY-3,2.8,3.4,p.x);oval(21,headY+2,6,4,p.tip);
  rect(-16,-6,13,6,p.b);rect(3,-6,14,6,p.b);
  poly([[-18,-16],[-31,-20],[-42,-35],[-46,-32],[-35,-12],[-15,-8]],p.O);
  wear(headY+12,headY-15,Math.sin(t*8));
  const paw=14+rise*43;
  poly([[2,-30],[paw,-36-rise*20],[paw+3,-31-rise*20],[8,-20]],p.O);
  if(t>=1.13)drawFish(paw,-39-rise*20);
  ctx.restore();
  if(t<1.13)drawFish(26,-62);
  const reach=Math.min(1,Math.max(0,(t-1.42)/.35));
  const palm=175-144*reach;
  rect(palm+13,-82,180,20,'#426872');rect(palm,-78,25,16,'#e6a37a');
  for(let i=0;i<3;i++)rect(palm-9+i*3,-77+i*5,14,4,'#edb18c');
  ctx.restore();
}
function draw(time){
  if(mode==='intro'||(mode==='paused'&&pausedFrom==='intro')){drawTheft();return;}
  const dusk=profile.place==='pier';
  const route=routes[profile.place];
  const sky=ctx.createLinearGradient(0,0,0,H*.35);sky.addColorStop(0,route?.sky || (dusk?'#454979':'#9bd9d1'));sky.addColorStop(1,route?.light || (dusk?'#eea184':'#ffdfab'));
  rect(0,0,W,H,sky);oval(W*.74,H*.14,W*.07,W*.07,dusk?'#ffe2bd':'#fff2b6');
  for(let i=0;i<12;i++){
    const y=H*(.185+.054*Math.sin(i*5));const bx=i*W/11;
    rect(bx,y,W*.11,H*.2,dusk?'#66647c':i%2?'#e4ae87':'#d69576');rect(bx-2,y-3,W*.115,4,'#a96d60');
    if(profile.place==='roofs')poly([[bx-4,y],[bx+W*.05,y-H*.045],[bx+W*.12,y]],i%2?'#af5742':'#ce7454');
    for(let j=0;j<2;j++)rect(bx+5+j*W*.045,y+9,W*.025,12,dusk||profile.place==='square'?'#f9d799':'#648e86');
  }
  rect(0,H*.27,W,H,route?.ground || (dusk?'#526f88':'#d6ae83'));
  if(profile.place==='square'){
    ctx.save();ctx.translate(W*.5,H*.275);ctx.scale(H/750,H/750);drawRouteObject(ctx,'square','side',1,time);ctx.restore();
    for(let i=0;i<=24;i++){
      const y=H*(.055+.045*Math.sin(Math.PI*i/24));rect(i*W/24,y,W/24+1,2,'#536469');
      festiveLight(ctx,i*W/24,y+4,2.7,i%3?'#ffd589':'#ff9b8d',time*1.7-i*.45);
    }
  }
  if(dusk){
    for(let i=0;i<42;i++){
      const ax=W*((i*.173)%1),ay=H*(.29+(i*.071)% .68);
      rect(ax+Math.sin(time+i)*2,ay,5+i%15,2,i%3?'#81949d':'#ebbf8c');
    }
    poly([[W*.46,H*.27],[W*.54,H*.27],[W*1.22,H],[-W*.22,H]],'#ab8b86');
  }
  for(const l of [-1.5,-.5,.5,1.5]){
    const a=project(130,l), b=project(-5,l);
    poly([[a.x,a.y],[b.x,b.y],[b.x+4,b.y],[a.x+.3,a.y]],'#b79373');
  }
  for(let z=100-distance%5;z>-5;z-=5){
    const p=project(z,0);rect(dusk?p.x-W*.49*(p.s*410/W):0,p.y,dusk?W*.98*(p.s*410/W):W,Math.max(1,p.s*2),route?.line || (dusk?'#8f7376':'#c49e7c'));
  }
  const items=[];
  for(let z=100-distance%12;z>-5;z-=12) for(const l of [-2.05,2.05])items.push({z,l,type:'side'});
  if(!waiting)for(const o of objects) if(o.at-distance<100 && o.at-distance>-4)items.push({z:o.at-distance,l:o.lane,type:o.type,rise:o.rise});
  if(!waiting)items.push({z:0,l:x,type:'cat'});
  items.sort((a,b)=>b.z-a.z);
  for(const obj of items){
    const p=project(obj.z,obj.l);ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    if(obj.type==='lowTable'){
      if(route){
        ctx.save();ctx.scale(1,.75);drawRouteObject(ctx,profile.place,'table',obj.l);ctx.restore();
      }else{
        rect(-35,-43,6,43,'#775841');rect(29,-43,6,43,'#775841');
        rect(-39,-50,78,9,dusk?'#779a9b':'#ce9761');
      }
    }else if(route && ['side','crate','table','stall'].includes(obj.type)){
      drawRouteObject(ctx,profile.place,obj.type,obj.l,time);
    } else if(dusk && obj.type==='side'){
      if(obj.l<0){
        rect(-3,-102,6,102,'#414657');rect(-9,-114,18,15,'#fff1b8');rect(-11,-117,22,4,'#504d58');
      } else {
        rect(-7,-24,14,24,'#61575a');oval(0,-24,10,4,'#a49280');
        for(let i=0;i<3;i++)rect(-8,-18+i*3,16,2,'#d1ac77');
      }
    } else if(dusk && obj.type==='crate'){
      ropeCoil();
    } else if(dusk && obj.type==='table'){
      kayakRack();
    } else if(dusk && obj.type==='stall'){
      crabPots();
    } else if(obj.type==='table'){
      rect(-38,-55,7,55,'#654d40');rect(31,-55,7,55,'#654d40');
      rect(-42,-63,84,12,'#9c5d41');rect(-43,-65,86,5,'#f3c47d');
      for(let i=0;i<7;i++)oval(-30+i*10,-68-i%2*3,6,5,i%3?'#de8549':'#889951');
      for(let i=0;i<7;i++)rect(-42+i*12,-59,12,7,i%2?'#ffdf9e':'#43867a');
      poly([[-6,-57],[6,-57],[0,-51]],'#243d39');

    } else if(obj.type==='side'||obj.type==='stall')booth(obj.l<0?'#c45b48':'#3b8983');
    else if(obj.type==='crate'){
      rect(-27,-23,54,23,'#805039');rect(-24,-21,48,8,'#ce8b4f');rect(-24,-10,48,7,'#dc9b59');
      rect(-21,-23,5,23,'#a06640');rect(16,-23,5,23,'#a06640');
    } else if(obj.type in durations){
      drawPowerup(ctx,obj.type);
    } else if(obj.type==='fish'){
      drawFish(0,-(obj.rise || 14));

    } else {
      oval(0,0,22-height()*6,6,'#a07c62');cat(0,-height()*65,1.55,time);
    }
    if(['crate','table','lowTable'].includes(obj.type)){
      const y=obj.type==='crate'?-15:obj.type==='table'?-57:-43;
      const mark=obj.type==='crate'?'↑':obj.type==='table'?'↓':'↑↓';
      const width=mark.length===2?31:19;
      rect(-width/2,y-9,width,18,'#294a46');
      ctx.fillStyle='#fff2bf';ctx.font='bold 17px system-ui';ctx.textAlign='center';
      ctx.textBaseline='middle';ctx.fillText(mark,0,y);
    }
    ctx.restore();
  }
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(mode==='intro') {
    introTime += dt;
    if(introTime >= introDuration) mode='run';
  } else if(mode==='run')tick(dt);
  if(mode!=='paused') soundtrack.update(mode==='menu'||mode==='over');
  const sceneTime=waiting?now/1000:mode==='menu'?now/1500:elapsed;
  draw(sceneTime);
  if(waiting)sittingCat(sceneTime);
  requestAnimationFrame(frame);
}
soundtrack.unlock();resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
