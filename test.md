# Explication et guide de test

Ce document présente l'organisation de l'API et explique comment lancer ses
tests automatisés et quelques requêtes manuelles sous Windows PowerShell.

## 1. Présentation du projet

L'application est une API REST construite avec Express. Elle utilise MongoDB
via Mongoose et écoute sur le port `5000` par défaut. Par défaut, la connexion
à la base est :

```text
mongodb://127.0.0.1:27017/database
```

Pour utiliser une autre base, indiquez l'URI dans `MONGODB_URI` dans le fichier
`.env` à la racine. Compass et l'API doivent utiliser la même URI et le même
nom de base :

```env
MONGODB_URI=mongodb://127.0.0.1:27017/database
TOKEN_SECRET=remplacer-par-une-cle-secrete-longue
```

Avec MongoDB Atlas, utilisez l'URI fournie par Atlas. Ne partagez pas et ne
commitez pas une URI contenant des identifiants.

Les principales parties du projet sont :

- `index.js` : initialise Express, configure les routeurs, vérifie les jetons
  Bearer et démarre le serveur.
- `src/routes/` : déclare les routes publiques de lecture et les routes
  d'inscription et de connexion.
- `src/protected_routes/post.js` : déclare les routes nécessitant une
  authentification, et pour la création d'article, une clé API.
- `src/controllers/` : contient le traitement des requêtes HTTP.
- `src/models/` : définit les schémas Mongoose des utilisateurs et des
  articles.
- `src/utils/buffer-compat.js` : fournit l'alias `SlowBuffer` attendu par une
  ancienne dépendance JWT lorsque Node.js ne l'expose plus.
- `src/utils/buffer-compat.test.js` : vérifie que JWT peut signer et vérifier
  un jeton après le chargement du correctif de compatibilité.

## 2. Routes de l'API

| Méthode | URL | Accès |
| --- | --- | --- |
| `GET` | `/posts` | Public : liste les articles |
| `GET` | `/posts/:id` | Public : récupère un article |
| `POST` | `/auth/register` | Public : crée un compte |
| `POST` | `/auth/login` | Public : connecte un compte et renvoie un jeton |
| `POST` | `/generateApiKey` | Jeton Bearer requis : génère une clé API |
| `POST` | `/posts/create` | Jeton Bearer et en-tête `x-api-key` requis |
| `PUT` | `/posts/update/:id` | Jeton Bearer requis |
| `DELETE` | `/posts/delete/:id` | Jeton Bearer requis |

Un article doit contenir `title`, `content` et `author`.

## 3. Préparer l'environnement

Depuis PowerShell, placez-vous à la racine du projet. Installez les
dépendances :

```powershell
npm ci
```

Le projet a besoin de `TOKEN_SECRET` pour signer les jetons. Définissez aussi
`MONGODB_URI` si vous n'utilisez pas la base locale par défaut. Ne partagez
pas ces valeurs et ne les commitez pas. Si vous gardez la valeur par défaut,
démarrez MongoDB sur `127.0.0.1:27017`. Le test automatisé décrit ci-dessous
ne nécessite pas MongoDB.

### Dépannage de l'installation de bcrypt sous Windows

Si npm indique que le script d'installation de `bcrypt` a été bloqué,
autorisez-le puis reconstruisez le module :

```powershell
npm install-scripts approve bcrypt
npm rebuild bcrypt
```

Si la reconstruction tente de lancer `mongosh.exe` avec l'option `-c`, npm
utilise le mauvais interpréteur de commandes. Configurez celui de Windows,
puis relancez la reconstruction :

```powershell
npm config set script-shell "${env:WINDIR}\System32\cmd.exe" --location=user
npm rebuild bcrypt
```

## 4. Lancer le test automatisé

À la racine du projet, exécutez :

```powershell
npm test
```

Les tests vérifient le correctif de compatibilité JWT et l'index sparse unique
de la clé API. Ils n'effectuent aucune requête HTTP et ne nécessitent pas de
connexion à MongoDB. Le résultat attendu est un test réussi sans échec.

## 5. Démarrer l'API

Une fois MongoDB démarré et le fichier `.env` configuré, lancez le serveur :

```powershell
npm start
```

Laissez cette fenêtre ouverte. Le serveur écoute sur
`http://localhost:5000`. Lancez les requêtes des sections suivantes dans une
deuxième fenêtre PowerShell.

## 6. Tester l'inscription et la connexion

Dans Postman, sélectionnez `POST`, saisissez l'URL ci-dessous, puis dans
**Body > raw > JSON**, envoyez ce JSON. Postman doit envoyer
`Content-Type: application/json`. L'inscription et la connexion ne demandent
pas de jeton Bearer.

URL d'inscription : `http://localhost:5000/auth/register`

```json
{
  "firstName": "Test",
  "lastName": "User",
  "username": "test-user-unique",
  "email": "test-user@example.com",
  "password": "Test-password-123!"
}
```

L'email et le nom d'utilisateur doivent être uniques; modifiez-les si le
compte existe déjà. Pour vous connecter, utilisez `POST` sur
`http://localhost:5000/auth/login` avec ce JSON et les mêmes identifiants :

```json
{
  "email": "test-user@example.com",
  "password": "Test-password-123!"
}
```

La réponse de connexion contient `token`. Après une inscription réussie,
retrouvez le compte dans la collection `users` de la base utilisée par l'API
(par défaut `database`).

Le script suivant crée un compte avec un nom d'utilisateur et une adresse
électronique uniques :

```powershell
$baseUrl = "http://localhost:5000"
$suffix = [guid]::NewGuid().ToString("N").Substring(0, 8)
$email = "test-$suffix@example.com"
$username = "test-$suffix"
$password = "Test-password-123!"

$registerBody = @{
    firstName = "Test"
    lastName = "User"
    username = $username
    email = $email
    password = $password
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
    -Uri "$baseUrl/auth/register" `
    -ContentType "application/json" `
    -Body $registerBody
```

La réponse contient les informations du compte, mais pas le mot de passe
haché. Connectez-vous ensuite :

```powershell
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post `
    -Uri "$baseUrl/auth/login" `
    -ContentType "application/json" `
    -Body $loginBody

$token = $login.token
```

La connexion répond `200` avec un jeton JWT. Une inscription réussie répond
`201`; une erreur `409` indique que le champ `field` de la réponse existe déjà.
Utilisez le jeton pour générer une clé API :

```powershell
$keyResponse = Invoke-RestMethod -Method Post `
    -Uri "$baseUrl/generateApiKey" `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body "{}"

$apiKey = $keyResponse.apikey

```

## 7. Créer et lire un article

La création requiert le jeton Bearer et la clé API obtenus à la section
précédente :

```powershell
$postBody = @{
    title = "Article de test"
    content = "Contenu créé pendant le test manuel."
    author = "Test User"
} | ConvertTo-Json

$createdPost = Invoke-RestMethod -Method Post `
    -Uri "$baseUrl/posts/create" `
    -Headers @{
        Authorization = "Bearer $token"
        "x-api-key" = $apiKey
    } `
    -ContentType "application/json" `
    -Body $postBody

$id = $createdPost._id
```

La création répond `201` avec l'article créé et son `_id`.
Pour consulter les articles :

```powershell
$posts = Invoke-RestMethod -Method Get -Uri "$baseUrl/posts"
$posts
```

La liste peut être vide si aucun article n'a encore été créé. Pour consulter
un article particulier, remplacer l'identifiant ci-dessous par sa valeur
`_id` :

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/posts/$id"
```

Pour modifier l'article, envoyez un `PUT` avec le jeton Bearer. La clé API
n'est pas requise pour cette route :

```powershell
$updateBody = @{
    title = "Article de test modifié"
    content = "Contenu mis à jour depuis PowerShell."
    author = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Method Put `
    -Uri "$baseUrl/posts/update/$id" `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body $updateBody
```

Pour supprimer l'article, envoyez un `DELETE` avec le même jeton :

```powershell
Invoke-RestMethod -Method Delete `
    -Uri "$baseUrl/posts/delete/$id" `
    -Headers @{ Authorization = "Bearer $token" }
```

## 8. Erreurs fréquentes

- **`SlowBuffer.prototype` est introuvable** : vérifiez que le démarrage passe
  par `index.js`, qui charge le correctif avant `jsonwebtoken`.
- **Connexion MongoDB refusée** : vérifiez que MongoDB fonctionne sur
  l'adresse indiquée par `MONGODB_URI`. Le serveur HTTP démarre même si la
  connexion échoue, mais les opérations nécessitant MongoDB ne fonctionneront
  pas tant que la connexion n'est pas rétablie.
- **Compte absent dans Compass** : vérifiez que Compass et l'API utilisent la
  même URI et la même base. Par défaut, la base est `database` et la collection
  des comptes est `users`.
- **Inscription toujours en 409** : vérifiez le champ `field` signalé dans la
  réponse. Pour `apiKey`, l'ancien index unique doit être remplacé : dans
  Compass, ouvrez `database` → `users` → **Indexes** et supprimez uniquement
  `apiKey_1` (ne supprimez pas la collection ni les autres index). Redémarrez
  ensuite l'API; elle recrée l'index sparse. Utilisez aussi un nouvel email et
  un nouveau nom d'utilisateur si l'un d'eux est déjà présent.
- **Erreur concernant `TOKEN_SECRET`** : vérifiez la présence de la variable
  dans `.env`, puis redémarrez le serveur.
- **Erreur `mongosh` avec l'option `-c`** : corrigez le réglage `script-shell`
  comme indiqué dans la section 3.
- **Erreur de module natif `bcrypt`** : autorisez son script d'installation et
  exécutez `npm rebuild bcrypt`.
