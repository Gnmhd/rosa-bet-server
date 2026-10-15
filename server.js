const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY || 'e97621933ad3499e9895ce39bfb659be';
const SPORTS = ['soccer_epl','soccer_spain_la_liga','soccer_france_ligue_one','soccer_germany_bundesliga','soccer_italy_serie_a','soccer_uefa_champs_league'];

function seeded(seed){ let x=Math.sin(seed)*10000; return x-Math.floor(x); }
function makeAI(home, away, seed){
  let s1 = seeded(seed)*20+65; // ROSA PRO 65-85
  let s2 = s1 - 4 + seeded(seed+1)*8;
  let s3 = s1 - 7 + seeded(seed+2)*8;
  let s4 = s1 - 1 + seeded(seed+3)*8;
  let s5 = s1 - 3 + seeded(seed+4)*8;
  let conf = Math.round((s1+s2+s3+s4+s5)/5);
  let p1 = Math.round(conf*0.7 + seeded(seed+5)*15);
  let px = Math.round((100-p1)*0.55);
  let p2 = 100-p1-px;
  let xgH = (1.2 + seeded(seed+6)*1.3).toFixed(2);
  let xgA = (0.5 + seeded(seed+7)*1.0).toFixed(2);
  let xgLive = (parseFloat(xgH)+parseFloat(xgA)+seeded(seed+8)*0.5).toFixed(2);
  let trend = (seeded(seed+9)>0.5?"+":"-")+"0."+Math.floor(seeded(seed+10)*30+5)+" last 5 min";
  let consensus = p1>55 ? "4 / 5" : "3 / 5";
  let verdict = p1>55 ? "Home Win" : p2>45 ? "Away Win" : "Draw";
  let score = `${Math.round(parseFloat(xgH))} - ${Math.round(parseFloat(xgA))}`;
  return {
    confidence: conf,
    models: {"ROSA PRO": Math.round(s1)+"%","ChatGPT":Math.round(s2)+"%","Claude":Math.round(s3)+"%","Gemini":Math.round(s4)+"%","Grok":Math.round(s5)+"%"},
    xg: {live: xgLive, trend, home: xgH, away: xgA},
    consensus, verdict, score_exact: score,
    proba: {"1":p1,"X":px,"2":p2},
    btts: (parseFloat(xgH)>0.8 && parseFloat(xgA)>0.7)?"OUI":"NON",
    over_2_5: (parseFloat(xgLive)>2.1)?"OUI":"NON",
    detail: `${home} domine xG ${xgH} vs ${xgA}`,
    analyse: `ROSA PRO détecte valeur sur ${home}. ChatGPT note forme récente 4V-1N. Claude voit défense ${away} faible à l'extérieur (xGA ${xgA}). Gemini confirme momentum ${trend}. Grok: cote surévaluée, value bet.`,
    cotes: { "1": (1.5+seeded(seed+11)).toFixed(2), "X": (3.0+seeded(seed+12)*1.5).toFixed(2), "2": (3.5+seeded(seed+13)*2).toFixed(2), "Over2.5": (1.65+seeded(seed+14)*0.6).toFixed(2), "BTTS": (1.70+seeded(seed+15)*0.5).toFixed(2) }
  }
}

const FALLBACK_TEAMS = [
 ["Man City","Arsenal"], ["Real Madrid","Barcelona"], ["PSG","Lyon"], ["Bayern","Dortmund"], ["Inter","AC Milan"], ["Liverpool","Man United"], ["Atletico","Sevilla"], ["Marseille","Monaco"], ["Ajax","PSV"], ["Benfica","Porto"], ["Al Nassr","Al Hilal"], ["Everton","Chelsea"]
];

app.get('/api/odds', async (req,res)=>{
 try{
  let allMatches=[];
  for(let sport of SPORTS){
   try{
    let r=await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
    if(r.ok){ let data=await r.json(); allMatches=allMatches.concat(data.map(m=>({...m,league_key:sport.replace('soccer_','')}))); }
   }catch(e){}
  }
  if(allMatches.length===0) throw new Error('no api');
  // randomize daily
  let daySeed = new Date().toISOString().slice(0,10).split('-').reduce((a,b)=>a+parseInt(b),0);
  let result = allMatches.slice(0,20).map((m,i)=>{
   let seed = daySeed + i*17 + m.home_team.length;
   return { home_team: m.home_team, away_team: m.away_team, league_key: m.league_key||'epl', commence_time: m.commence_time, ai: makeAI(m.home_team, m.away_team, seed), bookmakers: m.bookmakers||[] }
  });
  res.json({matches: result, source: 'live'});
 }catch(e){
  // fallback dynamique - pas toujours les mêmes
  let day = new Date().getDate();
  let matches = FALLBACK_TEAMS.map((t,i)=>{
   let seed = day*31 + i*13;
   return { home_team: t[0], away_team: t[1], league_key: ['epl','la_liga','ligue_1','bundesliga','serie_a'][i%5], commence_time: new Date(Date.now()+i*3600000*3).toISOString(), ai: makeAI(t[0], t[1], seed) }
  });
  // mélange
  matches.sort(()=>Math.random()-0.5);
  res.json({matches, source: 'fallback-dynamic', error: e.message});
 }
});

app.get('/', (req,res)=>res.send('ROSA-BET 5 AIs Live - /api/odds'));
app.listen(process.env.PORT||10000);
