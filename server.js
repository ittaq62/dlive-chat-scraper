const puppeteer = require('puppeteer');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const STREAMER = ''; // à remplir si besoin (ex: "nomDuStreamer")

// Stockage simple en mémoire (si tu relances le script, ça repart à zéro)
const tchatMessages = [];
const userColors = {};

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function getTimestamp() {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// WebSocket pour pousser le tchat en temps réel aux clients (front)
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('[WS] Client connecté');
  ws.send(JSON.stringify({ type: 'historique', tchat: tchatMessages, colors: userColors }));
});

function broadcastTchat(username, message) {
  const timestamp = getTimestamp();
  const fullMessage = `[${timestamp}] ${username}: ${message}`;

  // Couleur par utilisateur (sauf toi, si tu veux garder une couleur spéciale côté front)
  if (!userColors[username] && username !== 'A MODIFIER') {
    userColors[username] = getRandomColor();
  }

  tchatMessages.push(fullMessage);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'tchat', message: fullMessage, colors: userColors }));
    }
  });
}

// Serveur web pour servir la page du tchat
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tchat.html'));
});

// Petit endpoint pour vider le tchat côté serveur (et prévenir les clients)
app.post('/clear', (req, res) => {
  console.log('[HTTP] Clear tchat');
  tchatMessages.length = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'clear' }));
    }
  });

  res.sendStatus(200);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`[HTTP] Serveur en ligne : http://localhost:${PORT}`);
});

async function startScraper() {
  console.log('[SCRAPER] Démarrage Puppeteer');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  if (!STREAMER) {
    console.log('[SCRAPER] STREAMER est vide, pense à le remplir');
  }

  await page.goto(`https://dlive.tv/${STREAMER}`, { waitUntil: 'networkidle2' });

  // Si DLive change son HTML, c'est souvent là que ça casse
  await page.waitForSelector('.chat-row-wrap', { timeout: 60000 }).catch(() => {
    console.log("[SCRAPER] '.chat-row-wrap' introuvable (le DOM DLive a peut-être changé)");
  });

  // On scroll pour être sûr que la zone tchat est bien chargée
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 4000));

  // Fonction accessible depuis le navigateur (page.evaluate)
  await page.exposeFunction('processChatMessage', (username, message) => {
    console.log(`[CHAT] ${username}: ${message}`);
    broadcastTchat(username, message);
  });

  await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const firstRow = document.querySelector('.chat-row-wrap');
    const chatContainer = firstRow ? firstRow.parentElement : null;
    if (!chatContainer) return;

    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (!node.classList.contains('chat-row-wrap')) return;

          const usernameElement = node.querySelector('.dlive-name__text');
          if (!usernameElement) return;

          const username = clean(usernameElement.innerText).replace(/:$/, '');

          // Extraction "robuste" : on prend toute la ligne puis on retire "username:"
          let raw = clean(node.innerText);

          // Si DLive affiche un timestamp au début (selon leur UI)
          raw = raw.replace(/^\d{1,2}:\d{2}(:\d{2})?\s*/, '');

          // Retire "username:" au début (parfois présent deux fois selon le DOM)
          const reStart = new RegExp('^' + escapeRegex(username) + '\\s*:?\\s*');
          raw = raw.replace(reStart, '');
          raw = raw.replace(reStart, '');

          // Nettoie un ":" restant si jamais
          raw = raw.replace(/^:\s*/, '').trim();

          if (!raw) return;

          // @ts-ignore
          processChatMessage(username, raw);
        });
      });
    }).observe(chatContainer, { childList: true });
  });

  console.log('[SCRAPER] Écoute du tchat active');
}

startScraper().catch((e) => console.error('[SCRAPER] Erreur:', e));
