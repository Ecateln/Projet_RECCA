# 🛡️ Recca Chatbot - Une IA conversationnelle orientée cybersécurité

Ce projet propose un **chatbot spécialisé en cybersécurité** utilisant **Ollama** pour servir le modèle **de votre choix**, enrichi par un pipeline **RAG (Retrieval-Augmented Generation)** et des **scripts de scraping web**. Le projet inclut également la configuration necessaire a la mise en plce d'un **serveur avec base de données utilisateurs**, permettant une interaction personnalisée et sécurisée.

## 🧠 Fonctionnalités

- 🔐 **Authentification sécurisée des utilisateurs**
- 🤖 **Chatbot basé sur un modele au choix, via Ollama**
- 🔍 **Web scraping automatisé** de sources liées aux prompts utilisateurs
- 📚 **Pipeline RAG** : intégration des données récupérées dans les réponses de l'IA
- 🧾 **Historique de conversation** par utilisateur

---

##  Architecture du projet

Projet_Recca/

│── events/ <br/>
│   &emsp;└── .sample/<br/>
│   &emsp;└── conversation_create.js/<br/>
│   &emsp;└── conversation_delete.js/<br/>
│   &emsp;└── conversation_fetch.js/<br/>
│   &emsp;└── conversation_rename.js/<br/>
│   &emsp;└── login.js/<br/>
│   &emsp;└── query.js/<br/>
│   &emsp;└── user_update.js/<br/>

│── public/                 
│      &emsp;└── css/<br/>
│      &emsp;&emsp; └── loginPageStyle.css<br/>
│      &emsp;&emsp; └── registerPageStyle.css<br/>
│   &emsp;└── html/<br/>
│       &emsp;&emsp;└── loginPage.html<br/>
│       &emsp;&emsp;└── registerPage.html<br/>
│       &emsp;&emsp;└── temp_chat.html<br/>
│   &emsp;└── img/<br/>
│       &emsp;&emsp;└── FondAvecLogo.png<br/>
│   &emsp;└── js/<br/>
│       &emsp;&emsp;└── loginPageScript.js<br/>
│       &emsp;&emsp;└── registerPageScript.js<br/>
│       &emsp;&emsp;└── socket-io.js<br/>

│── util/                    
│   &emsp;└── database.js<br/>
│   &emsp;└── functions.js<br/>
│   &emsp;└── globals.js<br/>

│── README.md<br/>
│── .gitignore<br/>
│── index.js<br/>
│── package-lock.json<br/>
│── package.json<br/>
<br/>
<br/>
Branches dans ce git :<br/><br/>
│── main<br/>
│   &emsp;└── login_page<br/>
│   &emsp;└── chatbot_page<br/>
│   	&emsp;&emsp;└── responsive<br/>
│   	&emsp;&emsp;└── JS_modifications<br/>
│   &emsp;└── merge_front_back<br/>


---


##  🚀 Installation et Mise en place

Prérequis :

- Node.js >= 23.x<br/>
- Ollama<br/>
- PostgreSQL (ou SQLite selon configuration)<br/>
- Un serveur web pour l'hebergement<br/>

> Note : tout les composant ci dessus peuvent tourner dans des containers Dockers indépendant si besoin

Étapes : 

- Téléchargez et Installez [Ollama](https://ollama.com/download).

- Parcourez les differents [Modeles](https://ollama.com/search).

- Selectionner le modèle de votre choix.
> Pensez à prendre un modele en adequation avec vos besoins et les ressources de votre machine.

Une fois le modele selectionné, ouvrez un terminal :
</br>
</br>
Telechargez le modele en executant : ollama pull nom_du_modele

Ex :
```
ollama pull deepseek-r1
```

</br>
</br>
Vous pouvez tester le modele en executant : ollama run nom_du_modele

Ex : 
```
ollama run deepseek-r1
```

> Appuyez sur Ctrl+D pour sortir de la console de prompt

</br>
</br>
Pour rendre votre modele disponible sur un port de votre pc exécutez : ollama serve nom_du_modele 

Ex : 
```
ollama serve deepseek-r1
```















