# 📺 DLive Custom Chat Viewer

Ce projet est un outil Node.js qui permet de récupérer (scraper) le chat d'un stream **DLive** en temps réel et de l'afficher dans une interface web locale personnalisée.

Idéal pour les streamers souhaitant un overlay de chat entièrement personnalisable (CSS) ou un affichage secondaire propre sans avoir le retour vidéo du stream.

## ✨ Fonctionnalités

* **Scraping Temps Réel** : Utilise Puppeteer pour écouter le chat DLive sans utiliser d'API complexe.
* **Interface Custom** : Une page HTML/CSS propre, sombre et lisible.
* **Système VIP** : Mise en évidence spécifique pour l'administrateur (ex: `ittaq62`) avec icônes et couleurs distinctes.
* **Couleurs Aléatoires** : Chaque utilisateur se voit attribuer une couleur unique persistante durant la session.
* **Contrôle Admin** : Bouton "Clear Tchat" pour effacer l'historique localement.
* **Architecture WebSocket** : Communication instantanée entre le scraper et l'interface web.

## 🛠️ Prérequis

* [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
* Google Chrome (ou Chromium) installé (car Puppeteer l'utilise pour naviguer sur DLive).

## 🚀 Installation

1.  Clonez ce dépôt :
    ```bash
    git clone [https://github.com/ton-pseudo/dlive-only-tchat.git](https://github.com/ton-pseudo/dlive-only-tchat.git)
    cd dlive-only-tchat
    ```

2.  Installez les dépendances :
    ```bash
    npm install
    ```

## ⚙️ Configuration

Avant de lancer le serveur, vous devez spécifier le nom du streamer DLive à écouter.

1.  Ouvrez le fichier `server.js`.
2.  Cherchez la ligne suivante au début du fichier :
    ```javascript
    const STREAMER = ''; // à remplir si besoin (ex: "pewdiepie")
    ```
3.  Ajoutez le nom de la chaîne entre les guillemets (ex: `const STREAMER = 'ittaq62';`).

> **Note :** Si vous souhaitez modifier le style "VIP" pour un autre utilisateur que `ittaq62`, modifiez les conditions dans `tchat.html` et les classes CSS dans `style.css`.

## ▶️ Utilisation

1.  Lancez le serveur :
    ```bash
    npm start
    ```
    *Cela va ouvrir une fenêtre de navigateur (Puppeteer) qui se connectera à DLive. Ne la fermez pas, mais vous pouvez la réduire.*

2.  Accédez à l'interface de chat dans votre navigateur ou intégrez-la dans OBS :
    * URL : `http://localhost:3000`

## 📂 Structure du projet

* **`server.js`** : Le cœur du projet. Il lance le serveur Express, le WebSocket et le navigateur Puppeteer pour lire le chat.
* **`public/`** (servi via Express) :
    * `tchat.html` : La structure de la page du chat.
    * `style.css` : Le style (thème sombre, couleurs, mise en page).

## 🛡️ Technologies

* [Puppeteer](https://pptr.dev/) - Pour l'automatisation du navigateur.
* [Express](https://expressjs.com/) - Serveur Web.
* [ws](https://github.com/websockets/ws) - Bibliothèque WebSocket pour Node.js.

## 📄 Licence

Ce projet est sous licence ISC.
