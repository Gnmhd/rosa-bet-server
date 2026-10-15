const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'e97621933ad3499e9895ce39bfb659be';

app.use(cors());
app.use(express.static('public'));

const LEAGUES = {
  'champions': 'soccer_uefa_champs_league',
  'europa': 'soccer_uefa_europa_league',
  'laliga': 'soccer_spain_la_liga',
  'premier': 'soccer_epl',
  'bundesliga': 'soccer_germany_bundesliga',
  'ligue1': 'soccer_france_ligue_one'
};

// IA ROSA-BET - Moteur qui fait les % de ta vidéo 62.3% / 18.4% / 19.3%
function rosaAiEngine(coteHome, coteDraw, coteAway){
  const xGHome = parseFloat((1.2 + Math.random()*0.9).toFixed(1));
  const xGAway = parseFloat((0.6 + Math.random()*0.8).toFixed(1));
  const homeForm = Math.floor(Math.random()*2)+3;
  const awayForm = Math.floor(Math.random()*2)+1;

  const total = (1/coteHome + 1/coteDraw + 1/coteAway);
  let pHome = (1/coteHome)/total*100 + (homeForm-awayForm)*2 + (xGHome-xGAway)*3;
  let pDraw = (1/coteDraw)/total*100;
  pHome = Math.max(10, Math.min(85, pHome));
  pDraw = Math.max(8, Math.min(30, pDraw));
  let pAway = 100 - pHome - pDraw;

  let score = "1 - 1";
  if(pHome > 60) score = "2 - 0";
  else if(pHome > 52) score = "2 - 1";
  else if(pAway > 52) score = "0 - 1";

  let signals = 0;
  if(xGHome > 1.5) signals++;
  if(homeForm >=4) signals++;
  if(coteHome < 1.9) signals++;
  if(Math.abs(xGHome-xGAway) > 0.7) signals++;

  let confiance = signals<=1? "Faible" : signals==2? "Moyenne" : signals==3? "Forte" : "Très Forte";

  return {
    proba: {"1": parseFloat(pHome.toFixed(1)), "X": parseFloat(pDraw.toFixed(1)), "2": parseFloat(pAway.toFixed(1))},
    score_exact: score,
    double_chance: pHome>pAway? "1X" : "X2",
    btts: (xGHome>1 && xGAway>0.7)? "OUI" : "NON",
    over_2_5: (xGHome+xGAway>2.4)? "OUI" : "NON",
    total_buts: (xGHome+xGAway>1.5)? "+1.5" : "-1.5",
    xg: {home: xGHome, away: xGAway},
    confiance,
    signals,
    stars: "★".repeat(signals),
    detail_frappant: signals>=2? `${signals} signaux affectent la confiance` : "Analyse standard",
    constat: signals>=2? `${signals} signaux IA détectés - ${xGHome} xG vs ${xGAway} xG` : `Constat critique - xG ${xGHome} vs ${xGAway}`
  };
}

app.get('/api/odds', async (req,res)=>{
  const leagueQ = req.query.league || 'all';
  const dateQ = req.query.date || '15/10';
  let allMatches = [];
  const leaguesToFetch = LEAGUES[leagueQ]? [LEAGUES[leagueQ]] : Object.values(LEAGUES);

  for(const lgKey of leaguesToFetch){
    try{
      const url = `https://api.the-odds-api.com/v4/sports/${lgKey}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const r = await fetch(url);
      const data = await r.json();
      if(!Array.isArray(data)) continue;
      for(const m of data.slice(0,8)){
        if(!m.bookmakers ||!m.bookmakers[0]) continue;
        const outcomes = m.bookmakers[0].markets[0].outcomes;
        const cHome = outcomes.find(o=>o.name===m.home_team)?.price || 2.0;
        const cDraw = outcomes.find(o=>o.name==='Draw')?.price || 3.2;
        const cAway = outcomes.find(o=>o.name===m.away_team)?.price || 3.5;
        const ai = rosaAiEngine(cHome, cDraw, cAway);
        allMatches.push({...m, league_key: lgKey, ai});
      }
    }catch(e){ console.log('err', lgKey, e.message); }
  }

  // Si API vide -> matchs de ta vidéo 15/10 pour que l'app ne soit jamais vide
  if(allMatches.length===0){
    allMatches = [
      {home_team:"AZ Alkmaar",away_team:"Hapoel Be'er Sheva",league_key:"soccer_uefa_europa_league",commence_time:"2026-10-16T16:45:00Z",bookmakers:[{title:"Pinnacle",markets:[{outcomes:[{name:"AZ Alkmaar",price:1.62},{name:"Draw",price:3.8},{name:"Hapoel",price:5.1}]}]}],ai:rosaAiEngine(1.62,3.8,5.1)},
      {home_team:"Union Saint-Gilloise",away_team:"Real Sociedad",league_key:"soccer_uefa_europa_league",commence_time:"2026-10-16T16:45:00Z",bookmakers:[{title:"Winamax",markets:[{outcomes:[{name:"Union",price:2.15}]}]}],ai:rosaAiEngine(2.15,3.3,3.1)},
      {home_team:"Everton",away_team:"Chelsea",league_key:"soccer_epl",commence_time:"2026-10-15T19:45:00Z",bookmakers:[{title:"Bet365",markets:[{outcomes:[{name:"Everton",price:2.05}]}]}],ai:rosaAiEngine(2.05,3.4,3.2)},
    ];
  }

  res.json({success:true, date:dateQ, league:leagueQ, matches: allMatches, count: allMatches.length, users_online: 2700+Math.floor(Math.random()*200)});
});

app.get('/', (req,res)=>{ res.send('ROSA-BET AI FULL - '+new Date().toISOString()); });

app.listen(PORT, ()=>{ console.log('ROSA AI running '+PORT); });
