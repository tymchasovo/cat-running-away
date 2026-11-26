'use strict';
const soundtrack = (() => {
  let audio, nextBeat=0, beat=0, lastFish=-2, streak=0;
  const chords=[[196,246.94,293.66,369.99],[164.81,196,246.94,293.66],[130.81,196,261.63,329.63],[146.83,220,293.66,369.99]];
  function unlock(){
    if(!profile.music&&!profile.effects)return;
    try {
      const Engine=window.AudioContext||window.webkitAudioContext;
      if(!audio&&Engine) audio=new Engine();
      if(audio && audio.state!=='running') audio.resume().catch(()=>{});
    } catch {}
  }
  function note(freq,start,length,level,wave){
    const tone=audio.createOscillator(),gain=audio.createGain();
    tone.type=wave;tone.frequency.value=freq;
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+.013);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    tone.connect(gain);gain.connect(audio.destination);tone.start(start);tone.stop(start+length+.02);
    tone.onended=()=>{tone.disconnect();gain.disconnect();};
  }
  return {
    start(){unlock();beat=0;nextBeat=0;lastFish=-2;},
    update(){
      if(!audio||audio.state!=='running'||!profile.music||document.hidden)return;
      const now=audio.currentTime;
      if(nextBeat>now+.05)return;
      const when=Math.max(now,nextBeat), chord=chords[Math.floor(beat/8)%4];
      note(chord[[0,2,1,3,0,1,2,1][beat%8]],when,.62,.043,'triangle');
      nextBeat=when+.42;beat++;
    },
    fish(){
      if(!audio||audio.state!=='running'||!profile.effects)return;
      const now=audio.currentTime;
      streak=now-lastFish<.6?Math.min(2,streak+1):0;lastFish=now;
      const pitch=[659.25,783.99,987.77][streak];
      note(pitch,now,.20,.085,'sine');note(pitch*2,now,.11,.016,'sine');
    }
  };
})();
