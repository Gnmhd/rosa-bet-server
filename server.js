const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'e97621933ad3499e9895ce39bfb659be';

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

app.get('/api/odds', async (req, res) => {
  try {
    const filter = req.query.league || 'all';
    let leaguesToFetch = filter === 'all'? Object.values(LEAGUES) : [LEAGUES[filter]];
    let allMatches = [];
    for(let lg of leaguesToFetch){
      const url = `https://api.the-odds-api.com/v4/sports/${lg}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      if(Array.isArray(data)) allMatches = allMatches.concat(data.map(m => ({...m, league_key: lg})));
    }
    res.json({ success: true, matches: allMatches.slice(0,25) });
  } catch(e){ res.json({ success: false, error: e.message }); }
});

app.listen(PORT, () => console.log('ROSA SERVER V15 LIVE'));
