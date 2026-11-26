'use strict';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const el = id => document.getElementById(id);
const panel = el('panel'), hint = el('hint');
let best = 0;
try { best = Number(localStorage.getItem('cat-running-away.best')) || 0; } catch {}
el('best').textContent = best;
let mode = 'menu', distance = 0, fish = 0, lane = 0, x = 0, air = 0;
let elapsed = 0, nextRow = 0, objects = [], last = 0, pointer = null;
let W, H, slide = 0;
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
  soundtrack.start(); slide=0; el('fish').textContent=0;
  playedIntro = true; introTime = 0; pointer = null;
  distance = fish = lane = x = air = elapsed = 0;
  lesson = 'jump'; objects = [];
  addCrate(firstCrate, 0);
  objects.push({at:firstStall, lane:0, type:'stall'});
  for(const tableLane of [-1,0,1]) objects.push({at:firstTable,lane:tableLane,type:'table'});
  nextRow = 104; panel.hidden = true; hint.hidden = true; el('score').textContent = '0';
  last = performance.now();
}
function action(dir) {
  if (mode !== 'run') return;
  if (dir === 'up') { if (!air && !slide) air = .86; }
  else if(dir==='down') { if(!air && !slide) slide=.8; }
  else lane = Math.max(-1, Math.min(1, lane + dir));
}
el('start').onclick = start;
el('open-shop').onclick=()=>{panel.hidden=true;el('shop').hidden=false;refreshMenu();};
el('close-shop').onclick=()=>{el('shop').hidden=true;panel.hidden=false;};
for(const key of ['music','effects']) el(key).onclick=()=>changeProfile(p=>{p[key]=!p[key];});
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
  const keys = {ArrowLeft:-1,ArrowRight:1,ArrowUp:'up',ArrowDown:'down',' ':'up'};
  if (mode==='run' && e.key in keys) {e.preventDefault(); if(!e.repeat) action(keys[e.key]);}
};
const height = () => Math.sin(Math.PI*air/.86);
const points = () => Math.floor(distance)+10*fish;
function finish() {
  mode='over'; hint.hidden=true; panel.hidden=false;
  best = Math.max(points(),best);
  try { localStorage.setItem('cat-running-away.best',best); } catch {}
  el('best').textContent=best;
  panel.querySelector('h1').innerHTML='Забег<br><em>окончен</em>';
  el('detail').textContent=points()+' очк. · '+Math.floor(distance)+' м · 🐟 '+fish;
  el('start').textContent='Ещё раз →';
  refreshMenu();
}
function tick(dt) {
  const speed = Math.min(17,8+elapsed*.11);
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
        hint.textContent = jumping ? '↑  Смахни вверх' : sliding ? '↓  Смахни под стол' : '↔  Смахни в сторону';
        hint.hidden = false;
      }
    }
  }
  elapsed += advance/speed; distance += advance;
  x += Math.sign(lane-x)*Math.min(Math.abs(lane-x),dt*7);
  slide=Math.max(0,slide-dt);
  air=Math.max(0,air-dt);
  while(nextRow < distance+90) {
    const blocked=Math.floor(Math.random()*3)-1;
    const open=(blocked+2)%3-1;
    const roll=Math.random();
    const type=roll<.5?'crate':roll<.76?'table':'stall';
    if(type==='crate') addCrate(nextRow,blocked);
    else {
      objects.push({at:nextRow,lane:blocked,type});
      objects.push({at:nextRow,lane:open,type:'fish'});
    }
    if(nextRow>185 && Math.random()<.65) objects.push({at:nextRow,lane:-blocked-open,type:'stall'});
    nextRow+=nextRow<185?24:17+Math.random()*7;
  }
  for(const o of objects) {
    if(o.done || o.at>distance) continue;
    o.done=true;
    if(Math.abs(o.lane-x)>.48) continue;
    if(o.type==='fish') {
      if(o.rise?height()>.35:height()<.65){
        fish++; el('fish').textContent=fish;
        soundtrack.fish(); changeProfile(p=>{p.balance++;});
      }
    }
    else if(o.type==='stall'||(o.type==='table' ? slide<=0 : height()<.35)) {finish();break;}
  }
  objects=objects.filter(o=>o.at>distance-6 && !(o.type==='fish' && o.done));
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
function cat(cx,cy,s,time){
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  const beat=Math.sin(time*12);
  const palette=coats[profile.coat]||coats.ginger;
  if(slide>0) ctx.scale(1.22,.42);
  rect(-13,-9+beat*3,9,9,palette.b);rect(4,-9-beat*3,9,9,palette.b);
  sprite.forEach((row,j)=>[...row].forEach((v,i)=>{if(palette[v])rect((i-9.5)*3,(j-15)*3,3.15,3.15,palette[v]);}));
  ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1,-10);ctx.quadraticCurveTo(16,-4,20+beat*3,-21);
  ctx.strokeStyle=palette.x;ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle=palette.O;ctx.lineWidth=5;ctx.stroke();
  oval(20+beat*3,-21,3.2,3.8,palette.tip);
  if(profile.neck==='scarf'){
    rect(-13,-23,25,5,'#b52c33');
    poly([[5,-23],[24,-18+beat*3],[18,-13+beat*3],[3,-19]],'#e54c48');
  }
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
  if(profile.neck==='scarf')rect(-11,headY+12,25,5,'#c53c3e');
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
  if(mode==='intro'){drawTheft();return;}
  const dusk=profile.place==='pier';
  const sky=ctx.createLinearGradient(0,0,0,H*.35);sky.addColorStop(0,dusk?'#454979':'#9bd9d1');sky.addColorStop(1,dusk?'#eea184':'#ffdfab');
  rect(0,0,W,H,sky);oval(W*.74,H*.14,W*.07,W*.07,dusk?'#ffe2bd':'#fff2b6');
  for(let i=0;i<12;i++){
    const y=H*(.185+.054*Math.sin(i*5));const bx=i*W/11;
    rect(bx,y,W*.11,H*.2,dusk?'#66647c':i%2?'#e4ae87':'#d69576');rect(bx-2,y-3,W*.115,4,'#a96d60');
    for(let j=0;j<2;j++)rect(bx+5+j*W*.045,y+9,W*.025,12,dusk?'#f9d799':'#648e86');
  }
  rect(0,H*.27,W,H,dusk?'#526f88':'#d6ae83');
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
    const p=project(z,0);rect(dusk?p.x-W*.49*(p.s*410/W):0,p.y,dusk?W*.98*(p.s*410/W):W,Math.max(1,p.s*2),dusk?'#8f7376':'#c49e7c');
  }
  const items=[];
  for(let z=100-distance%12;z>-5;z-=12) for(const l of [-2.05,2.05])items.push({z,l,type:'side'});
  for(const o of objects) if(o.at-distance<100 && o.at-distance>-4)items.push({z:o.at-distance,l:o.lane,type:o.type,rise:o.rise});
  items.push({z:0,l:x,type:'cat'});
  items.sort((a,b)=>b.z-a.z);
  for(const obj of items){
    const p=project(obj.z,obj.l);ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    if(dusk && obj.type==='side' && obj.l<0){
      rect(-3,-102,6,102,'#414657');rect(-9,-114,18,15,'#fff1b8');rect(-11,-117,22,4,'#504d58');
    } else if(obj.type==='table'){
      rect(-34,-47,68,10,'#533f39');rect(-35,-49,70,5,'#e2b578');
      rect(-32,-39,7,39,'#795640');rect(25,-39,7,39,'#795640');
      rect(-8,-60,16,14,'#3c7979');poly([[-5,-55],[0,-50],[5,-55],[2,-55],[2,-58],[-2,-58],[-2,-55]],'#fff0c1');
    } else if(dusk && obj.type==='stall'){
      booth('#526987');oval(-27,0,7,7,'#444457');oval(27,0,7,7,'#444457');
    } else if(obj.type==='side'||obj.type==='stall')booth(obj.l<0?'#c45b48':'#3b8983');
    else if(obj.type==='crate'){
      if(dusk) poly([[-27,-17],[-20,-28],[20,-28],[27,-17]],'#af8966');
      rect(-27,-23,54,23,dusk?'#886655':'#805039');rect(-24,-21,48,8,'#ce8b4f');rect(-24,-10,48,7,'#dc9b59');
      rect(-21,-23,5,23,'#a06640');rect(16,-23,5,23,'#a06640');
    } else if(obj.type==='fish'){
      drawFish(0,-(obj.rise || 14));

    } else {
      oval(0,0,22-height()*6,6,'#a07c62');cat(0,-height()*65,1.55,time);
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
  if(mode==='intro'||mode==='run') soundtrack.update();
  draw(mode==='run'?elapsed:mode==='menu'?now/1500:0);
  requestAnimationFrame(frame);
}
resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
