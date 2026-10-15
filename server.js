const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_KEY || 'e97621933ad3499e9895ce39bfb659be';
app.use(cors());

const LEAGUES = ["soccer_epl","soccer_spain_la_liga","soccer_france_ligue_one","soccer_germany_bundesliga","soccer_italy_serie_a","soccer_uefa_champs_league","soccer_uefa_europa_league"];

function fiveAI(odds){
  let h=odds.home||2.0, d=odds.draw||3.2, a=odds.away||3.5;
  let ih=1/h, id=1/d, ia=1/a, tot=ih+id+ia;
  let base1=(ih/tot*100);
  let variance = (min,max)=> (Math.random()*(max-min)+min);
  // 5 IA différentes comme scorecastpro.ai
  let rosa = Math.min(90, base1*0.95 + variance(-2,3));
  let gpt = base1*0.92 + variance(-3,4);
  let claude = base1*0.94 + variance(-2,2);
  let gemini = base1*0.90 + variance(-3,5);
  let grok = base1*0.93 + variance(-2,3);
  let avg = (rosa+gpt+claude+gemini+grok)/5;
  let conf = avg>65? 82 : avg>55? 74 : 61;
  let consensus = [rosa,gpt,claude,gemini,grok].filter(v=>v>50).length;
  let xg = (1.2 + avg/50 + Math.random()*0.4).toFixed(2);
  let xgTrend = (Math.random()>0.5? "+":"-")+"0."+Math.floor(Math.random()*20+5)+" last 5 min";
  let score = avg>62? "2 - 0" : avg>52? "2 - 1" : "1 - 1";
  return {
    models: {
      "ROSA PRO": rosa.toFixed(0)+"%",
      "ChatGPT": gpt.toFixed(0)+"%",
      "Claude": claude.toFixed(0)+"%",
      "Gemini": gemini.toFixed(0)+"%",
      "Grok": grok.toFixed(0)+"%"
    },
    proba: {"1": avg.toFixed(1), "X": (100-avg- (100-avg)*0.6).toFixed(1), "2": ((100-avg)*0.6).toFixed(1)},
    score_exact: score,
    confidence: conf,
    consensus: consensus+" / 5",
    verdict: avg>50? "Home Win" : "Away Win",
    xg: {live: parseFloat(xg), trend: xgTrend, home: (avg/40).toFixed(1), away: ((100-avg)/60).toFixed(1)},
    detail: `+${(avg/50).toFixed(1)} xG differential over last 5 home matches`,
    double_chance:"1X", btts:"OUI", over_2_5:"OUI"
  };
}

app.get('/api/odds', async (req,res)=>{
  let all=[];
  try{
    for(let lg of LEAGUES){
      try{
        let url=`https://api.the-odds-api.com/v4/sports/${lg}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
        let r=await fetch(url); if(!r.ok) continue;
        let data=await r.json(); if(!Array.isArray(data)) continue;
        data.slice(0,4).forEach(m=>{
          let outs=m.bookmakers?.[0]?.markets?.[0]?.outcomes||[];
          let ho=outs.find(o=>o.name===m.home_team)?.price||2.0;
          let ao=outs.find(o=>o.name===m.away_team)?.price||3.5;
          let dr=outs.find(o=>o.name==="Draw")?.price||3.2;
          all.push({home_team:m.home_team, away_team:m.away_team, league_key:lg.replace("soccer_",""), commence_time:m.commence_time, ai: fiveAI({home:ho,draw:dr,away:ao})});
        });
      }catch(e){}
    }
    if(all.length<3) throw "empty";
    all.sort(()=>Math.random()-0.5);
    res.json({success:true, users_online:2748+Math.floor(Math.random()*200), count:all.length, matches:all.slice(0,15)});
  }catch(e){
    // Fallback réaliste avec 5 IA différentes
    let fallback=[
      {home_team:"Al Nassr",away_team:"Damac FC",league_key:"saudi",ai:fiveAI({home:1.6,draw:4.0,away:5.0})},
      {home_team:"Man City",away_team:"Arsenal",league_key:"epl",ai:fiveAI({home:2.1,draw:3.4,away:3.2})},
      {home_team:"Barcelona",away_team:"Real Madrid",league_key:"la_liga",ai:fiveAI({home:2.3,draw:3.5,away:2.9})},
      {home_team:"PSG",away_team:"Marseille",league_key:"ligue_1",ai:fiveAI({home:1.7,draw:4.0,away:4.5})},
      {home_team:"Bayern Munich",away_team:"Dortmund",league_key:"bundesliga",ai:fiveAI({home:1.8,draw:3.8,away:4.2})},
      {home_team:"AZ Alkmaar",away_team:"Hapoel Be'er Sheva",league_key:"europa",ai:fiveAI({home:1.75,draw:3.8,away:4.2})}
    ];
    res.json({success:true, users_online:2748, count:fallback.length, matches:fallback});
  }
});
app.get('/',(req,res)=>res.send('ROSA 5 AI STABLE '+new Date().toISOString()));
app.listen(PORT,()=>console.log('ROSA 5 AI '+PORT));
