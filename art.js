'use strict';
const routes = {
  park:{sky:'#a7c9c0',light:'#ffe1a0',ground:'#cb9a63',line:'#bc8b56',tip:'Перепрыгивай поленницы, скользи под ветками. Дерево можно обойти или перепрыгнуть двойным прыжком.'},
  square:{sky:'#243558',light:'#847eaa',ground:'#dde9ea',line:'#c6d9df',tip:'Перепрыгивай подарки, скользи под арками. Снеговика можно обойти или перепрыгнуть двойным прыжком.'}
};
function illustration(c){
  return {
    box(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);},
    disc(x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();},
    shape(points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  };
}
function drawWear(c,id,beat=0,view='front'){
  const {box,disc,shape}=illustration(c);
  if(id==='panama'){
    shape([[-11,0],[-8,-11],[7,-12],[12,0]],'#e9ae37');box(-15,-2,31,5,'#ffc959');box(-10,-5,20,3,'#91602f');
  }else if(id==='beret'){
    shape([[-15,-4],[-16,-10],[-10,-15],[0,-17],[11,-14],[15,-10],[11,-5],[-2,-2]],'#993352');
    shape([[-13,-6],[-3,-4],[12,-7],[10,-3],[-11,0]],'#652940');
    box(-4,-19,3,4,'#742640');
  }else if(id==='captain'){
    shape([[-15,-11],[-11,-17],[0,-20],[12,-17],[16,-12],[12,-6],[-12,-6]],'#8e9ba7');
    shape([[-14,-12],[-10,-16],[0,-18],[11,-16],[14,-12],[11,-8],[-11,-8]],'#fff6de');
    if(view==='back'){
      shape([[-12,-8],[12,-8],[11,-2],[4,0],[-5,0],[-11,-2]],'#314459');
      box(-5,-5,10,2,'#596c7e');
      return;
    }
    box(-12,-8,24,5,'#314459');
    shape([[-12,-4],[12,-4],[8,0],[1,1],[-9,-1]],'#273646');
    box(-.8,-15,1.6,6,'#b78238');box(-3,-13,6,1.4,'#b78238');
    shape([[-4,-11],[0,-9],[4,-11],[3,-8],[0,-7],[-3,-8]],'#b78238');
  }else if(id==='cap'){
    shape([[-14,0],[-5,-17],[5,-19],[15+beat*2,-10],[5,-12],[11,0]],'#c44043');
    disc(15+beat*2,-9,5.2,'#8496a3');box(-15,-3,29,7,'#8496a3');
    disc(15+beat*2,-9,4,'#fff3d8');box(-14,-2,27,5,'#fff3d8');
  }else if(id==='bow'){
    shape([[-12,-5],[0,-1],[12,-5],[12,5],[0,1],[-12,5]],'#36865e');box(-2,-3,5,6,'#225b49');
  }else if(id==='scarf'){
    shape([[-14,-3],[11,-3],[7,3],[-2,12]],'#98333a');
    shape([[-14,-3],[7,-1],[-2,9]],'#db5247');
    shape([[6,-2],[12,-6],[15,-3],[11,1]],'#c13f44');
    shape([[11,0],[19,2+beat],[15,4],[17,7],[9,2]],'#ae363d');
    box(-10,-2,6,1,'#f39372');
  }else if(['dots','winter'].includes(id)){
    const color=id==='dots'?'#366c9e':'#29705c';
    box(-13,-2,26,5,color);
    shape([[4,0],[24,4+beat*3],[18,10+beat*3],[3,3]],color);
    if(id==='dots')for(const x of [-10,-3,4,11,18])disc(x,x>12?5+beat*3:0,1.3,'#fff4d7');
    if(id==='winter'){for(const x of [-9,0,9])box(x,-2,4,5,'#da5247');box(16,3+beat*3,4,5,'#da5247');}
  }
}
function drawPortrait(c,coat,time,dressed=false,motion={}){
  const p=coats[coat]||coats.ginger;
  const {shape}=illustration(c);
  function oval(x,y,w,h,color){
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,0,0,Math.PI*2);c.fill();
  }
  const {scene='',pose=0,step=0,facing=1,progress=0}=motion;
  const play=scene==='play'?pose:0;
  const wash=scene==='wash'?pose:0;
  const wipe=wash && progress>.43?Math.sin(Math.PI*Math.min(1,(progress-.43)/.42)):0;
  const stride=scene==='walk'||scene==='dash'?pose:0;
  oval(0,0,25,4,'#ad937c');
  c.save();
  c.translate(-18*play,-3*play-Math.abs(step)*2);
  c.rotate(play*1.83);
  c.scale(1+stride*.08,1-stride*.15);
  oval(0,-15,17,17,p.b);oval(0,-15,12,16,p.O);
  for(const side of [-1,1]){
    const kick=play*Math.sin(time*11+side*1.8);
    if(side===-1 && wash>0)continue;
    oval(side*(8+play*4)+step*side*6,-2+kick*5-Math.max(0,step*side)*3,6,4,p.tip);
  }
  c.save();
  c.translate(8*stride*facing,stride*2);
  c.rotate(stride*facing*.12-wash*.10);
  for(const side of [-1,1]){
    const ear=coat==='calico'?(side<0?p.b:p.o):coat==='siamese'?p.o:p.O;
    shape([[side*19,-51],[side*17,-31],[side*4,-39]],ear);
    shape([[side*16,-46],[side*15,-37],[side*8,-40]],p.p);
  }
  oval(0,-33,19,15,p.O);
  if(coat==='calico'){oval(-9,-36,8,8,p.b);oval(11,-37,6,7,p.o);}
  if(coat==='siamese')oval(0,-32,14,10,p.b);
  if(coat==='silver'||coat==='ginger')for(const x of [-6,0,6])shape([[x-2,-46],[x+2,-46],[x,-38]],p.b);
  for(const side of [-1,1]){
    oval(side*8,-34,2.4,time%4.2>4?.55:3,'#252831');
    oval(side*4,-28,5,3,coat==='siamese'?p.o:p.tip);
  }
  shape([[-3,-31],[3,-31],[0,-28]],p.p);
  if(wash && progress>.18 && progress<.43){
    const lick=Math.sin(Math.PI*(progress-.18)/.25);
    oval(-2,-26+lick,2,2*lick,p.p);
  }
  if(dressed){
    c.save();c.translate(0,-44);drawWear(c,profile.hat);c.restore();
  }
  c.restore();
  if(dressed){
    c.save();c.translate(stride*facing*5,-21);drawWear(c,profile.neck);c.restore();
  }
  const tip=Math.sin(time*2),tailX=-4-12*stride*facing;
  const tailY=-2+tip-11*stride;
  c.lineCap='round';c.lineWidth=6;c.strokeStyle=p.b;c.beginPath();c.moveTo(14,-13);
  c.bezierCurveTo(23,-3,19,4,tailX,tailY);c.stroke();
  oval(tailX,tailY,4,3,p.tip);
  if(wash>0){
    const pawX=-8+wash*(5-12*wipe),pawY=-2-wash*(23+11*wipe);
    c.strokeStyle=p.O;c.lineWidth=6;c.beginPath();c.moveTo(-9,-16);
    c.quadraticCurveTo(-17,-18,pawX,pawY);c.stroke();
    oval(pawX,pawY,4.5,4,p.tip);
  }
  if(play>0){
    for(const side of [-1,1]){
      const pawX=side*(9+6*play),pawY=-17+play*(10+5*Math.sin(time*12+side));
      c.strokeStyle=p.O;c.beginPath();c.moveTo(side*8,-19);c.lineTo(pawX,pawY);c.stroke();
      oval(pawX,pawY,4,4,p.tip);
    }
  }
  c.restore();
}
function festiveLight(c,x,y,r,color,phase){
  const glow=Math.min(1,Math.max(0,.5+1.25*Math.sin(phase)));
  c.save();c.fillStyle=color;
  for(const [radius,alpha] of [[r*3.5,.24*glow],[r*1.85,.38*glow],[r,.22+.78*glow]]){
    c.globalAlpha=alpha;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
  }
  if(glow>.65){c.globalAlpha=glow;c.fillStyle="#fff5d6";c.fillRect(x-r*.45,y-r*.45,r*.9,r*.9);}
  c.restore();
}
function drawRouteObject(c,place,type,side=1,time=0){
  const {box,disc,shape}=illustration(c);
  const brown='#694b40';
  if(place==='square'){
    if(type==='crate'){box(-24,-27,48,27,'#bd4751');box(-27,-29,54,6,'#d75e65');box(-4,-29,8,29,'#ffcd69');disc(-5,-32,5,'#ffce60');disc(5,-32,5,'#ffce60');}
    else if(type==='table'){box(-35,-59,6,59,'#498073');box(29,-59,6,59,'#498073');box(-38,-65,76,13,'#346558');for(let i=-30;i<=30;i+=10)disc(i,-58,2.8,i%20?'#ffd781':'#f58580');}
    else if(type==='stall'){c.save();c.scale(1.16,1.25);disc(0,-18,21,'#f8faf1');disc(0,-46,14,'#fffdf4');box(-14,-60,28,4,brown);box(-9,-70,18,11,brown);box(-12,-36,24,4,'#bf4647');disc(-4,-49,1.8,brown);shape([[0,-47],[11,-45],[0,-43]],'#e8863e');c.restore();}
    else {box(-4,-20,8,20,brown);for(let i=0;i<3;i++)shape([[-30+i*6,-12-i*16],[0,-69-i*12],[30-i*6,-12-i*16]],i%2?'#438773':'#326e61');for(let i=0;i<9;i++)festiveLight(c,Math.sin(i*4)*(5+i),-72+i*6,2.6,['#ffca63','#ff9992','#68adff'][i%3],time*2.8+Math.floor(i/3)*2.1+side);disc(0,-92,4,'#ffe292');}
  }else if(place==='park'){
    if(type==='crate'){for(const [x,y] of [[-16,-9],[0,-9],[16,-9],[-8,-22],[8,-22]]){disc(x,y,9,brown);disc(x,y,6,'#dba66a');disc(x,y,2,'#a16a46');}}
    else if(type==='table'){
      shape([[-42,0],[-35,-15],[-38,-52],[-41,-68],[-35,-65],[-31,-55],[-12,-59],[5,-65],[29,-67],[41,-77],[36,-66],[15,-60],[-5,-53],[-29,-49],[-28,-13],[-23,0]],brown);
      shape([[-34,-11],[-36,-49],[-32,-54],[-31,-26]],'#97704e');
      for(const [x,y,a,color] of [[-21,-56,-.7,'#df9739'],[-10,-59,.5,'#b85532'],[5,-64,-.8,'#dfa339'],[22,-67,.4,'#ca6131'],[34,-71,-.4,'#eeb94c']]){
        c.save();c.translate(x,y);c.rotate(a);
        shape([[0,1],[-6,-1],[-4,-4],[-8,-9],[-2,-8],[0,-14],[3,-8],[8,-10],[6,-5],[8,-3]],color);
        box(0,-8,1,10,'#985b39');c.restore();
      }
    }
    else {box(-5,-74,10,74,brown);disc(0,-78,29,'#ce7436');disc(-17,-62,22,'#de953e');disc(14,-63,20,'#ecb24c');
      if(type==='stall')box(-17,-19,34,19,'#885941');
      else {for(let i=0;i<4;i++)box(-33+i*19,-20,3,20,brown);box(-36,-15,65,3,brown);}}

  }
}

function drawPowerup(c,type,phase=null){
  const {disc,shape,box}=illustration(c);
  const field=phase!==null, wave=field?Math.sin(phase):0;
  if(field){
    c.translate(0,-6+wave*3);c.scale(1.35,1.35);
    if(type==='rod')c.rotate(wave*.13);
    if(type==='mint')c.scale(Math.max(.28,Math.abs(Math.cos(phase*.7))),1);
  }
  if(type==='mint'){
    if(!field)disc(0,-21,19,'#e0eed0');
    shape([[-11,-9],[-13,-22],[-9,-22],[-9,-31],[-5,-29],[1,-36],[11,-38],[12,-27],[9,-22],[12,-22],[6,-14],[-2,-10]],field&&Math.cos(phase*.7)<0?'#91bd73':'#42875d');
    shape([[-13,-6],[-11,-5],[8,-32]],'#245941');
  }else if(type==='rod'){
    if(!field)disc(0,-23,21,'#c7efd5');shape([[-14,-6],[-10,-5],[9,-39],[7,-41]],'#805332');
    c.save();c.translate(8,-39);c.rotate(wave*.22);box(0,0,1.6,19,'#46636b');disc(0,21,3,'#dc6650');c.restore();disc(-8,-13,4,'#456562');
  }else{
    c.save();c.translate(0,-20);c.scale(1,.65);if(!field)disc(0,0,17,'#fff0a0');disc(0,0,12,'#f9b62d');c.restore();
    shape([[-9,-20],[-20+wave*3,-29+wave*2],[-20+wave*3,-11+wave*2]],'#d28a26');disc(6,-22,2,'#785128');if(field && wave>.3)box(-6+wave*8,-24,2,6,'#fff4aa');
    shape([[12,-38],[14,-33],[18,-32],[14,-30],[12,-26],[11,-30],[7,-32],[11,-34]],'#fff4af');
  }
}
