'use strict';
const routes = {
  roofs:{sky:'#cf95a2',light:'#ffd49b',ground:'#c76f52',line:'#aa573f',tip:'Перепрыгивай коньки крыш, скользи под бельём и обходи трубы.'},
  park:{sky:'#a7c9c0',light:'#ffe1a0',ground:'#cb9a63',line:'#bc8b56',tip:'Перепрыгивай поленницы, скользи под ветками и обходи деревья в кадках.'},
  square:{sky:'#243558',light:'#847eaa',ground:'#dde9ea',line:'#c6d9df',tip:'Перепрыгивай подарки, скользи под арками и обходи снеговиков.'}
};
function illustration(c){
  return {
    box(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);},
    disc(x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();},
    shape(points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  };
}
function drawWear(c,id,beat=0){
  const {box,disc,shape}=illustration(c);
  if(id==='panama'){
    shape([[-11,0],[-8,-11],[7,-12],[12,0]],'#e9ae37');box(-15,-2,31,5,'#ffc959');box(-10,-5,20,3,'#91602f');
  }else if(id==='cap'){
    shape([[-14,0],[-5,-17],[5,-19],[15+beat*2,-10],[5,-12],[11,0]],'#c44043');
    disc(15+beat*2,-9,4,'#fff3d8');box(-14,-2,27,5,'#fff3d8');
  }else if(id==='bow'){
    shape([[-12,-5],[0,-1],[12,-5],[12,5],[0,1],[-12,5]],'#36865e');box(-2,-3,5,6,'#225b49');
  }else if(['scarf','dots','winter'].includes(id)){
    const color=id==='dots'?'#366c9e':id==='winter'?'#29705c':'#c84242';
    box(-13,-2,26,5,color);
    shape([[4,0],[24,4+beat*3],[18,10+beat*3],[3,3]],color);
    if(id==='dots')for(const x of [-10,-3,4,11,18])disc(x,x>12?5+beat*3:0,1.3,'#fff4d7');
    if(id==='winter'){for(const x of [-9,0,9])box(x,-2,4,5,'#da5247');box(16,3+beat*3,4,5,'#da5247');}
  }
}
function festiveLight(c,x,y,r,color,phase){
  const glow=(1+Math.sin(phase))/2;
  c.save();c.fillStyle=color;
  for(const [radius,alpha] of [[r*(1.5+glow),.06+.14*glow],[r,.5+.5*glow]]){
    c.globalAlpha=alpha;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
  }
  c.restore();
}
function drawRouteObject(c,place,type,side=1,time=0){
  const {box,disc,shape}=illustration(c);
  const brown='#694b40';
  if(place==='square'){
    if(type==='crate'){box(-24,-27,48,27,'#bd4751');box(-27,-29,54,6,'#d75e65');box(-4,-29,8,29,'#ffcd69');disc(-5,-32,5,'#ffce60');disc(5,-32,5,'#ffce60');}
    else if(type==='table'){box(-35,-59,6,59,'#498073');box(29,-59,6,59,'#498073');box(-38,-65,76,13,'#346558');for(let i=-30;i<=30;i+=10)disc(i,-58,2.8,i%20?'#ffd781':'#f58580');}
    else if(type==='stall'){disc(0,-18,21,'#f8faf1');disc(0,-46,14,'#fffdf4');box(-14,-60,28,4,brown);box(-9,-70,18,11,brown);box(-12,-36,24,4,'#bf4647');disc(-4,-49,1.8,brown);shape([[0,-47],[11,-45],[0,-43]],'#e8863e');}
    else {box(-4,-20,8,20,brown);for(let i=0;i<3;i++)shape([[-30+i*6,-12-i*16],[0,-69-i*12],[30-i*6,-12-i*16]],i%2?'#438773':'#326e61');for(let i=0;i<9;i++)festiveLight(c,Math.sin(i*4)*(5+i),-72+i*6,2.6,i%2?'#ffca63':'#ff9992',time*(1.3+i*.09)+i*2.4+side);disc(0,-92,4,'#ffe292');}
  }else if(place==='park'){
    if(type==='crate'){for(const [x,y] of [[-16,-9],[0,-9],[16,-9],[-8,-22],[8,-22]]){disc(x,y,9,brown);disc(x,y,6,'#dba66a');disc(x,y,2,'#a16a46');}}
    else if(type==='table'){shape([[-35,0],[-35,-66],[-4,-60],[33,-72],[39,-64],[2,-52],[-28,-54],[-28,0]],brown);for(let i=-22;i<38;i+=10)disc(i,-65-Math.abs(i)/8,7,'#c77736');}
    else {box(-5,-74,10,74,brown);disc(0,-78,29,'#ce7436');disc(-17,-62,22,'#de953e');disc(14,-63,20,'#ecb24c');
      if(type==='stall')box(-17,-19,34,19,'#885941');
      else {for(let i=0;i<4;i++)box(-33+i*19,-20,3,20,brown);box(-36,-15,65,3,brown);}}
  }else if(type==='table'){
    box(-35,-70,4,70,brown);box(31,-70,4,70,brown);box(-35,-68,70,2,brown);
    for(let i=0;i<4;i++)box(-28+i*15,-67,12,14,i%2?'#82b0af':'#ffdfb0');
  }else if(type==='crate'){
    shape([[-29,0],[-19,-20],[20,-20],[29,0]],'#9c4e3f');for(let i=-20;i<20;i+=10)box(i,-18,8,17,'#d7815b');
  }else{
    box(-16,-61,32,61,'#aa644f');box(-20,-64,40,8,'#84483d');
    for(let i=0;i<4;i++)box(-15,-49+i*12,31,2,'#ce9274');
    if(type==='side')shape([[-48,0],[0,-26],[48,0]],side<0?'#a85344':'#bf6950');
  }
}

function drawPowerup(c,type){
  const {disc,shape,box}=illustration(c);
  if(type==='mint'){
    disc(0,-21,19,'#e0eed0');
    shape([[-11,-9],[-13,-22],[-9,-22],[-9,-31],[-5,-29],[1,-36],[11,-38],[12,-27],[9,-22],[12,-22],[6,-14],[-2,-10]],'#42875d');
    shape([[-13,-6],[-11,-5],[8,-32]],'#245941');
  }else if(type==='rod'){
    disc(0,-23,21,'#c7efd5');shape([[-14,-6],[-10,-5],[9,-39],[7,-41]],'#805332');
    box(8,-39,1.6,19,'#46636b');disc(8,-18,3,'#dc6650');disc(-8,-13,4,'#456562');
  }else{
    c.save();c.translate(0,-20);c.scale(1,.65);disc(0,0,17,'#fff0a0');disc(0,0,12,'#f9b62d');c.restore();
    shape([[-9,-20],[-20,-29],[-20,-11]],'#d28a26');disc(6,-22,2,'#785128');
    shape([[12,-38],[14,-33],[18,-32],[14,-30],[12,-26],[11,-30],[7,-32],[11,-34]],'#fff4af');
  }
}
