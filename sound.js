'use strict';
const soundtrack = (() => {
  let audio, nextBeat=0, beat=0, lastFish=-2, streak=0;
  const voices=new Set();

  const chords=[[55,59,62],[52,55,59],[48,52,55],[50,54,57]];
  const melody=[
    [71,0,69,67,0,0,69,0], [71,0,74,0,71,0,67,0],
    [69,0,67,64,0,0,67,0], [69,0,66,0,62,0,66,69]
  ];
  const hz=midi=>440*2**((midi-69)/12);
  function unlock(){
    if(!profile.music&&!profile.effects)return;
    try {
      const Engine=window.AudioContext||window.webkitAudioContext;
      if(!audio&&Engine)audio=new Engine();
      if(audio&&audio.state!=='running')audio.resume().catch(()=>{});
    } catch {}
  }
  function note(freq,start,duration,level,wave,attack=.035,release=.12){
    const voice=audio.createOscillator(),gain=audio.createGain();
    voice.type=wave;voice.frequency.value=freq;
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(level,start+attack);
    gain.gain.exponentialRampToValueAtTime(level*.78,start+duration-release);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    voice.connect(gain);gain.connect(audio.destination);voices.add(voice);
    voice.onended=()=>{voice.disconnect();gain.disconnect();voices.delete(voice);};
    voice.start(start);voice.stop(start+duration+.01);
  }
  function silence(){
    for(const voice of voices)voice.stop();
    voices.clear();nextBeat=0;beat-=beat%8;
  }
  return {
    unlock,silence,
    start(){unlock();silence();beat=0;lastFish=-2;},
    update(menu=false){
      const halfBeat=menu?.47:.31;
      if(!audio||audio.state!=='running'||!profile.music||document.hidden)return;
      const now=audio.currentTime;
      nextBeat=Math.max(now,nextBeat);
      while(nextBeat<now+.19){
        const bar=Math.floor(beat/8)%4, step=beat%8, phrase=melody[bar];
        if(step===0)for(const pitch of chords[bar])note(hz(pitch),nextBeat,8*halfBeat+.22,.017,'sine',.17,.32);
        if(phrase[step]){
          let length=1;
          while(step+length<8&&!phrase[step+length])length++;
          note(hz(phrase[step]),nextBeat,length*halfBeat+.075,menu?.021:.032,menu?'sine':'triangle',.038,.13);
        }
        if(step===0||step===4)note(hz(chords[bar][step===0?0:2]-12),nextBeat,.86,.035,'sine',.06,.22);
        nextBeat+=halfBeat;beat++;
      }
    },
    impact(){
      if(!audio||audio.state!=='running'||!profile.effects)return;
      const now=audio.currentTime;
      note(128,now,.16,.074,'triangle',.006,.13);
      note(72,now+.045,.23,.065,'sine',.009,.18);
    },
    fish(){
      if(!audio||audio.state!=='running'||!profile.effects)return;
      const now=audio.currentTime;
      streak=now-lastFish<.6?Math.min(2,streak+1):0;lastFish=now;
      const pitch=[659.25,783.99,987.77][streak];
      note(pitch,now,.2,.075,'sine',.01,.14);note(pitch*2,now,.11,.014,'sine',.008,.08);
    }
  };
})();
