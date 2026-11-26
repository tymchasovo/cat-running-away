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
let W, H;
let introTime = 0, playedIntro = false, lesson = '';
const firstCrate = 28, firstStall = 58, introDuration = 1.55;
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
  playedIntro = true; introTime = 0; pointer = null;
  distance = fish = lane = x = air = elapsed = 0;
  lesson = 'jump'; objects = [];
  addCrate(firstCrate, 0);
  objects.push({at:firstStall, lane:0, type:'stall'});
  nextRow = 78; panel.hidden = true; hint.hidden = true; el('score').textContent = '0';
  last = performance.now();
}
function action(dir) {
  if (mode !== 'run') return;
  if (dir === 'up') { if (!air) air = .86; }
  else lane = Math.max(-1, Math.min(1, lane + dir));
}
el('start').onclick = start;
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
  else if (dy<0) action('up');
}
canvas.onpointermove = swipe;
canvas.onpointerup = e => { swipe(e); pointer=null; };
canvas.onpointercancel = () => { pointer=null; };
window.onkeydown = e => {
  const keys = {ArrowLeft:-1,ArrowRight:1,ArrowUp:'up',' ':'up'};
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
}
function tick(dt) {
  const speed = Math.min(17,8+elapsed*.11);
  let advance = speed*dt;
  if (lesson) {
    const jumping = lesson === 'jump';
    const cue = jumping ? firstCrate-3.6 : firstStall-4;
    if (distance+advance >= cue) {
      if (lane !== 0 || (jumping && air >= .60)) {
        lesson = jumping ? 'dodge' : '';
        hint.hidden = true;
      } else {
        advance = Math.max(0, cue-distance);
        hint.textContent = jumping ? '↑  Смахни вверх' : '↔  Смахни в сторону';
        hint.hidden = false;
      }
    }
  }
  elapsed += advance/speed; distance += advance;
  x += Math.sign(lane-x)*Math.min(Math.abs(lane-x),dt*7);
  air=Math.max(0,air-dt);
  while(nextRow < distance+90) {
    const blocked=Math.floor(Math.random()*3)-1;
    const open=(blocked+2)%3-1;
    const type=Math.random()<.55?'crate':'stall';
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
    if(o.type==='fish') {if(o.rise?height()>.35:height()<.65) fish++;}
    else if(o.type==='stall'||height()<.35) {finish();break;}
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
function cat(cx,cy,s,time){
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  const beat=Math.sin(time*12);
  rect(-13,-9+beat*3,9,9,'#904828');rect(4,-9-beat*3,9,9,'#904828');
  const palette={x:'#654135',O:'#f29b46',b:'#bf592e',p:'#efac85',o:'#e18741'};
  sprite.forEach((row,j)=>[...row].forEach((v,i)=>{if(palette[v])rect((i-9.5)*3,(j-15)*3,3.15,3.15,palette[v]);}));
  ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1,-10);ctx.quadraticCurveTo(16,-4,20+beat*3,-21);
  ctx.strokeStyle='#87432b';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#f4a458';ctx.lineWidth=5;ctx.stroke();ctx.restore();
}
function drawFish(x,y){
  poly([[x-10,y],[x-18,y-7],[x-18,y+7]],'#245963');
  oval(x,y,12,7,'#42aaa9');oval(x+5,y-2,1.7,1.7,'#173e44');
}
function drawTheft(){
  const t = introTime;
  const approach = Math.min(1,t/.50);
  const escape = Math.min(1,Math.max(0,(t-.55)/.84));
  const reach = Math.max(0,Math.sin(Math.PI*Math.min(1,Math.max(0,(t-.55)/.84))));
  const cx = -42-53*approach + 95*escape;
  const cy = -25*Math.sin(Math.PI*approach)-12*Math.sin(Math.PI*escape);
  ctx.save();
  ctx.translate(-145,0);booth('#c45b48');ctx.restore();
  if(t<.50) drawFish(-113,-41);
  oval(cx,0,22,6,'#a07c62');cat(cx,cy,1.55,t);
  if(t>=.50 && escape<1) drawFish(cx-19,cy-39);
  if(reach>0){
    const palm=-158+62*reach;
    rect(-209,-54,palm+200,16,'#345e67');
    rect(palm-12,-54,8,17,'#fbdeb1');
    rect(palm-4,-53,16,14,'#d98761');
    rect(palm+9,-54,12,4,'#e8a078');
    rect(palm+9,-47,9,4,'#e8a078');
  }
}
function draw(time){
  const sky=ctx.createLinearGradient(0,0,0,H*.35);sky.addColorStop(0,'#9bd9d1');sky.addColorStop(1,'#ffdfab');
  rect(0,0,W,H,sky);oval(W*.74,H*.14,W*.07,W*.07,'#fff2b6');
  for(let i=0;i<12;i++){
    const y=H*(.185+.054*Math.sin(i*5));const bx=i*W/11;
    rect(bx,y,W*.11,H*.2,i%2?'#e4ae87':'#d69576');rect(bx-2,y-3,W*.115,4,'#a96d60');
    for(let j=0;j<2;j++)rect(bx+5+j*W*.045,y+9,W*.025,12,'#648e86');
  }
  rect(0,H*.27,W,H,'#d6ae83');
  for(const l of [-1.5,-.5,.5,1.5]){
    const a=project(130,l), b=project(-5,l);
    poly([[a.x,a.y],[b.x,b.y],[b.x+4,b.y],[a.x+.3,a.y]],'#b79373');
  }
  for(let z=100-distance%5;z>-5;z-=5){
    const p=project(z,0);rect(0,p.y,W,Math.max(1,p.s*2),'#c49e7c');
  }
  const items=[];
  for(let z=100-distance%12;z>-5;z-=12) for(const l of [-2.05,2.05])items.push({z,l,type:'side'});
  for(const o of objects) if(o.at-distance<100 && o.at-distance>-4)items.push({z:o.at-distance,l:o.lane,type:o.type,rise:o.rise});
  items.push({z:0,l:x,type:'cat'});
  items.sort((a,b)=>b.z-a.z);
  for(const obj of items){
    const p=project(obj.z,obj.l);ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    if(obj.type==='side'||obj.type==='stall')booth(obj.l<0?'#c45b48':'#3b8983');
    else if(obj.type==='crate'){
      rect(-27,-23,54,23,'#805039');rect(-24,-21,48,8,'#ce8b4f');rect(-24,-10,48,7,'#dc9b59');
      rect(-21,-23,5,23,'#a06640');rect(16,-23,5,23,'#a06640');
    } else if(obj.type==='fish'){
      drawFish(0,-(obj.rise || 14));
    } else if(mode==='intro'){
      drawTheft();
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
  draw(mode==='run'?elapsed:mode==='menu'?now/1500:0);
  requestAnimationFrame(frame);
}
resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
