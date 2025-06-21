# 🛡️ Recca Chatbot - Une IA conversationnelle orientée cybersécurité

Ce projet propose un **chatbot spécialisé en cybersécurité** utilisant **Ollama** pour servir le modèle **de votre choix**, enrichi par un pipeline **RAG (Retrieval-Augmented Generation)** et des **scripts de scraping web**. Le projet inclut également la configuration necessaire a la mise en place d'un **serveur avec base de données utilisateurs**, permettant une interaction personnalisée et sécurisée.

## 🔧 Fonctionnalités

- 🔐 **Authentification sécurisée des utilisateurs**
- 🤖 **Chatbot basé sur un modele au choix, via Ollama**
- 🔍 **Web scraping automatisé** de sources liées aux prompts utilisateurs
- 📚 **Pipeline RAG** : intégration des données récupérées dans les réponses de l'IA
- 🧾 **Historique de conversation** par utilisateur

---

##  Architecture du projet

**Projet_Recca/** <br/>
│── events/ <br/>
│   &emsp;└── .sample/<br/>
│   &emsp;└── conversation_create.js<br/>
│   &emsp;└── conversation_delete.js<br/>
│   &emsp;└── conversation_fetch.js<br/>
│   &emsp;└── conversation_rename.js<br/>
│   &emsp;└── login.js<br/>
│   &emsp;└── query.js<br/>
│   &emsp;└── user_update.js<br/>
│<br/>
│── public/                 
│      &emsp;└── css/<br/>
│      &emsp;&emsp; └── loginPageStyle.css<br/>
│      &emsp;&emsp; └── registerPageStyle.css<br/>
│   &emsp;└── html/<br/>
│       &emsp;&emsp;└── loginPage.html<br/>
│       &emsp;&emsp;└── registerPage.html<br/>
│       &emsp;&emsp;└── chatBotPage.html<br/>
│   &emsp;└── img/<br/>
│       &emsp;&emsp;└── FondAvecLogo.png<br/>
│   &emsp;└── js/<br/>
│       &emsp;&emsp;└── loginPageScript.js<br/>
│       &emsp;&emsp;└── registerPageScript.js<br/>
│       &emsp;&emsp;└── socket-io.js<br/>
│<br/>
│── util/                    
│   &emsp;└── database.js<br/>
│   &emsp;└── functions.js<br/>
│   &emsp;└── globals.js<br/>
│<br/>
│── README.md<br/>
│── .env<br/>
│── .gitignore<br/>
│── index.js<br/>
│── package-lock.json<br/>
│── package.json<br/>
<br/>
**Branches dans ce git :**<br/>
│── main<br/>
    &emsp;└── login_page<br/>
    &emsp;└── chatbot_page<br/>
    	&emsp;&emsp;└── responsive<br/>
    	&emsp;&emsp;└── JS_modifications<br/>
    &emsp;└── merge_front_back<br/>


---


##  🚀 Installation et Mise en place du modele IA 

### Prérequis :

- Node.js, version >= 23.x<br/>
- Ollama<br/>
- PostgreSQL (ou SQLite selon configuration)<br/>
- Un serveur web pour l'hebergement<br/>

> Note : tout les composants ci-dessus peuvent tourner dans des containers Dockers indépendants si besoin

### Marche à suivre : 

- Téléchargez et Installez [Ollama](https://ollama.com/download).

- Parcourez les differents [Modeles](https://ollama.com/search).

- Selectionner le modèle de votre choix.
> Pensez à prendre un modele en adéquation avec vos besoins et les ressources de votre machine.

Une fois le modèle sélectionné, ouvrez un terminal :
</br>
</br>
Téléchargez le modèle en executant : `ollama pull <nom_du_modele>`

Ex :
```
ollama pull deepseek-r1
```
</br>
Vous pouvez tester le modèle en executant : ollama run nom_du_modele

Ex : 
```
ollama run deepseek-r1
```

> Aide : Appuyez sur Ctrl+D pour sortir de la console de prompt

</br>
Pour rendre votre modèle disponible sur un port de votre pc exécutez: `ollama serve nom_du_modele`

Ex : 
```
ollama serve deepseek-r1
```

---

##  💻 Installation et Mise en place du serveur

### Installation via GitHub : 
</br>
Rendez-vous dans le répertoire dans lequel vous voulez télécharger le serveur chatbot et ouvrez un terminal.
</br>
</br>

```
git clone https://github.com/Ecateln/Projet_RECCA.git
```

Puis : 
</br>

```
cd Projet_RECCA.git
```
### Installation manuelle :
- Cliquez sur le bouton vert < > Code sur l'accueil du projet GitHub.</br>
- Télécharger le fichier zip</br> 
- Dézipper le fichier dans le repertoire cible</br>
</br>

### Pour lancer le serveur :

Avant de lancer le serveur, il faut copier le fichier `.env.template` vers `.env`, et en modifier le contenu, qui ne comporte que des valeurs par défaut non adaptées à un usage instantané.
Consultez le fichier pour découvrir les différentes valeurs à renseigner.
</br><br/>

Dans un terminal de commande (ouvert dans le dossier Projet_RECCA) exécutez : 
</br>

```
node index.js
```  
Votre Chatbot est maintenant disponible sur votre serveur !!! 


---


##  📄 Documentation

### Base de données : 
Voici un apercu des tables necessaires au bon fonctionnement du chatbot : 
</br>

| Tables      | Values               | Type                                |
|------------:|----------------------|-------------------------------------|
| User        | User_Id              | Number AUTO INCREMENTAL PRIMARY KEY |
|             | Username             | String                              |
|             | Password             | String                              |
|             | Personnalisation_info| String                              |
|             |                      |                                     |
|Conversation | Conv_Id              | Number AUTO INCREMENTAL PRIMARY KEY |
|             | Author_id            | Number EXTERNAL KEY                 |
|             | Title                | String                              |
|             | Creation_date        | DATE                                |
|             |                      |                                     |
| Messages    | Message_Id           | Number AUTO INCREMENTAL PRIMARY KEY |
|             | Conv_Id              | Number EXTERNAL KEY                 |
|             | Content              | String                              |
|             | Author               | BOOL                                |
|             | Creation_date        | DATE                                |
|             |                      |                                     |
| Tokens      | Value                | Number PRIMARY KEY                  |
|             | User_id              | Number EXTERNAL KEY                 |
|             | Expires_at           | TIMESTAMP                           |

Ces tables peuvent bien sur être modifiées/améliorées<br/>
### Modele IA 
Représentation du Model IA et des composants auxiliaires :
</br>

&emsp;&emsp;_______ BDD</br>
&emsp;   │   
&emsp;   │   
Serveur ── Web Scrapper</br>
&emsp;   │   
&emsp;   │ _______ RAG Script</br>
&emsp;   │   
&emsp;   │ _______ Ollama</br> 
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;  │</br>
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;  │</br>
&emsp;&emsp;&emsp;&emsp;    Model IA</br>

#### Serveur Node.js :
Le serveur Node.js joue le rôle de répartiteur :
- Il reçoit les prompts de l’utilisateur.</br></br>
- Il invoque le scrapper web sur demande de l’utilisateur.</br></br>
- Enfin, il établit un socket de connexion qui transmet le prompt (et les informations récupérées du web si le scrapper est activé) au modèle d’IA disponible grâce à une instance de serveur Ollama, qui sert d’interface pour faire tourner le modèle localement.</br>

Une fois la réponse générée par le modèle d’IA, celle-ci est :
- Renvoyée à Node.js via Ollama.</br></br>
- Puis, Node.js enregistre le triplet utilisateur + prompt + réponse dans la base de données (BDD) avant de retourner la réponse à l'utilisateur.</br></br>

Le serveur gère aussi les connexions avec les utilisateurs. Les connexions au socket sont sécurisées via SSL et des jetons de connexion sont utilisés pour contrôler les accès au service tout en évitant d’avoir à demander le mot de passe de l’utilisateur à chaque étape.
Les technologies utilisées sont: Express pour la gestion des routes HTTP(S), le package Ollama pour la connection au modèle d’IA, pg-promise pour la connection à la BDD PostgreSQL, et socket-io pour avoir une implémentation rapide d’un serveur du socket côté client et serveur.
</br>
#### Base de données

Cette base de données permet de conserver un historique des échanges pour chaque utilisateur.

Elle permet également la mise en place d’un système de prompt générique, lu à chaque début de conversation. Celui-ci est rentré par l’utilisateur à sa convenance, dans un souci de personnalisation des réponses du modèle. Ainsi a chaque fois que l’utilisateur crée une discussion, ce prompt sera inséré en tant que première instruction au modèle afin de personnaliser la suite des échanges selon les souhaits de l’utilisateur.
</br>
#### Web Scrapper
En parallèle nous avons également mis en place un scrapper web qui a pour but de combler les informations auxquelles l’IA ne peut pas avoir accès. 
Il s’agit d’un script Node.js qui :
- Intercepte le prompt que l’utilisateur a donné à l'IA pour d’abord récupérer les informations nécessaires à la réponse sur le web.</br></br> 
- Il fait donc d’abord une requête au modèle pour trouver la formulation de recherche adaptée au prompt.</br></br>
- L’utilise pour faire une recherche sur internet grâce à l’API SERPAPI (ou peut-être Brave si la première se révèle être trop limitante) pour récupérer l’url des 10 premiers sites qui apparaissent pour répondre à la recherche.</br></br>
- Une fois les urls récupérées, le script fetch le contenu des 10 sites et les donne au modèles pour lui permettre d’affiner sa réponse.</br></br>
- Le modèle répond ensuite à l'utilisateur à partir des données fournies.</br>

Ce script est invoqué si et seulement si l’utilisateur a coché l’option “rechercher sur le web”.
</br>
#### RAG
Le script de rag  permet de construire un système simple de RAG (Retrieval-Augmented Generation) en Node.js pour répondre à une question en s’appuyant sur des documents locaux (au format txt).
</br>
Fonctionnalités principales :
</br>
- Chargement des documents :
  Le script lit tous les fichiers .txt et .pdf présents dans le dossier data du serveur.
  Le contenu des fichiers est nettoyé, découpé (dans le cas des PDF), et stocké dans une liste “documents”.</br></br>
- Recherche de documents pertinents :
  Une fonction de scoring naïf mesure la pertinence des documents vis-à-vis de la question posée, en comptant les mots en commun.
  Les 3 documents les plus pertinents sont sélectionnés (topK = 3).</br></br>
- Génération de la réponse via Ollama :
  Le modèle Qwen reçoit un prompt enrichi contenant la question et les documents pertinents.
  La réponse générée est ensuite transmise normalement à l’utilisateur.

### Serveur
Le serveur Web est un serveur Node.js qui pourra être hébergé sur la plateforme de votre choix. Profitez donc de toutes les protections fournies par la dite plateforme, en particulier la détection et prévention d’attaques de type DDoS.</br>
Le serveur doit être équipé d’un cœur virtuel, de 8GB de mémoire vive et de 64 GB de stockage en SSD pour pouvoir supporter des modeles d'IA performants.<br/>
Pour simplifier son installation, la base de données tourne dans un conteneur Docker dans le serveur Web.<br/>

### Conclusion
Nous avons détaillé ici les étapes concrètes à suivre pour développer le Chatbot, ainsi que l'architecture des différents fichiers à utiliser.</br>
Nous avons donc plusieurs parties: 
- la Base de Données</br>
- l'Interface Web</br>
- le Modèle</br>
- le Serveur</br>
- 2 scripts d’affinage du modèle ; utilisant des langages différents mais interagissant pour former le Chatbot.</br>

Nous avons cependant laissé une certaine flexibilité concernant certaines parties, notamment le serveur, pour permettre la mise en place de mesures contrant les différents problèmes qui peuvent être rencontrés lors du développement.</br>
Cependant, ce README suffit à  décrire le squelette de l'application, qui peut ensuite etre étoffé afin d'obtenir un Chatbot fonctionnel, sans la nécessité de modifications majeures du fonctionnement. Ainsi, dans le cas où il est nécessaire de repenser intégralement une partie du projet, cela ne devrait pas fortement impacter le reste du projet, de par la pseudo-indépendance des composants.





