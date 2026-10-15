const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = 'e97621933ad3499e9895ce39bfb659be';

app.use(cors());
app.use(express.static('public'));

// Endpoint qui récupère les vraies cotes
app.get('/api/odds', async (req, res) => {
  try {
    const leagues = ['soccer_epl','soccer_spain_la_liga','soccer_france_ligue_one'];
    let allMatches = [];
    
    for(let lg of leagues){
      const url = `https://api.the-odds-api.com/v4/sports/${lg}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      allMatches = allMatches.concat(data.slice(0,3));
      if(allMatches.length >= 8) break;
    }
    res.json({ success: true, matches: allMatches });
  } catch(e){
    res.json({ success: false, error: e.message });
  }
});

app.get('/', (req,res) => res.send('ROSA-BET SERVER LIVE 🔥'));

app.listen(PORT, () => console.log(`Serveur lancé sur port ${PORT}`));
