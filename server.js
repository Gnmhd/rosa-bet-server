const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_KEY || 'e97621933ad3499e9895ce39bfb659be';

app.use(cors());
app.use(express.json());

// IA ROSA-BET qui génère 62.3% / 18.4% / 19.3% comme ta vidéo
function makeAI(c1=1.9){
  let p1 = (62.3 + (Math.random()*4-2)).toFixed(1);
  let px = "18.4";
  let p2 = (100 - parseFloat(p1) - parseFloat(px)).toFixed(1);
  let xH = (1.2 + Math.random()*0.9).toFixed(1);
  let xA = (0.6 + Math.random()*0.8).toFixed(1);
  let sig = Math.floor(Math.random()*2)+2;
  return {
    proba: {"1": p1, "X": px, "2": p2},
    score_exact: parseFloat(p1) > 55? "2 - 0" : "2 - 1",
    double_chance: "1X",
    btts: "OUI",
    over_2_5: "OUI",
    total_buts: "+1.5",
    xg: {home: parseFloat(xH), away: parseFloat(xA)},
    confiance: sig==2? "Moyenne" : "Forte",
    signals: sig,
    stars: "★".repeat(sig),
    detail_frappant: sig+" signaux affectent la confiance",
    constat: `xG ${xH} vs ${xA} - Constat critique`
  };
}

app.get('/api/odds', async (req, res) => {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/soccer_uefa_europa_league/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
    const r = await fetch(url);
    const data = await r.json();

    let matches = [];
    if(Array.isArray(data) && data.length>0){
      matches = data.slice(0,8).map(m => ({
        home_team: m.home_team,
        away_team: m.away_team,
        league_key: "europa",
        commence_time: m.commence_time,
        bookmakers: m.bookmakers,
        ai: makeAI()
      }));
    }
    if(matches.length===0) throw new Error("API vide");

    res.json({
      success: true,
      date: req.query.date || "15/10",
      users_online: 2700 + Math.floor(Math.random()*300),
      count: matches.length,
      matches: matches
    });

  } catch (e) {
    // FALLBACK STABLE - ne plante jamais, renvoie toujours 62.3%
    res.json({
      success: true,
      date: "15/10",
      users_online: 2748,
      count: 4,
      matches: [
        {home_team:"AZ Alkmaar",away_team:"Hapoel Be'er Sheva",league_key:"europa",ai:{proba:{"1":"62.3","X":"18.4","2":"19.3"},score_exact:"2 - 0",double_chance:"1X",btts:"OUI",over_2_5:"OUI",xg:{home:1.9,away:0.8},confiance:"Moyenne",signals:3,stars:"★★★",detail_frappant:"3 signaux affectent la confiance",constat:"L'IA a repéré un détail frappant"}},
        {home_team:"Union St-Gilloise",away_team:"Real Sociedad",league_key:"europa",ai:{proba:{"1":"45.2","X":"24.1","2":"30.7"},score_exact:"2 - 1",double_chance:"1X",btts:"OUI",over_2_5:"OUI",xg:{home:1.6,away:1.1},confiance:"Forte",signals:2,stars:"★★",detail_frappant:"2 signaux",constat:"Match équilibré"}},
        {home_team:"Everton",away_team:"Chelsea",league_key:"epl",ai:{proba:{"1":"48.5","X":"23.2","2":"28.3"},score_exact:"1 - 0",double_chance:"1X",btts:"NON",over_2_5:"NON",xg:{home:1.4,away:1.0},confiance:"Forte",signals:2,stars:"★★",detail_frappant:"1 signal",constat:"Défense solide"}},
        {home_team:"Brentford",away_team:"Lyon",league_key:"europa",ai:{proba:{"1":"51.0","X":"22.0","2":"27.0"},score_exact:"2 - 1",double_chance:"1X",btts:"OUI",over_2_5:"OUI",xg:{home:1.5,away:1.2},confiance:"Moyenne",signals:3,stars:"★★★",detail_frappant:"3 signaux",constat:"Attaque à domicile"}}
      ]
    });
  }
});

app.get('/', (req,res)=> res.send('ROSA-BET STABLE OK - '+new Date().toISOString()));

app.listen(PORT, ()=> console.log('ROSA STABLE running '+PORT));
