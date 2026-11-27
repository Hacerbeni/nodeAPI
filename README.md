# API REST Node.js

API Express utilisant MongoDB avec Mongoose.

## Installation et démarrage

À la racine du projet :

```powershell
npm ci
```

Créez ou complétez le fichier `.env` :

```env
TOKEN_SECRET=une-cle-secrete-longue-et-personnelle
MONGODB_URI=mongodb://127.0.0.1:27017/database
PORT=5000
```

`MONGODB_URI` est facultative si vous utilisez la valeur locale par défaut.
MongoDB Compass doit être connecté à la même URI et à la même base. Ne
partagez pas le contenu du fichier `.env`.
`TOKEN_SECRET` est obligatoire. L’application valide ces paramètres au
démarrage et s’arrête avec une erreur explicite si une valeur est invalide.
Les corps des requêtes d’inscription, de connexion et de création/modification
de posts sont également validés avec Zod. Une requête invalide reçoit une
réponse `400` avec les champs en erreur.

Si cette base a déjà servi avec une ancienne version du projet, ouvrez
`database` → `users` → **Indexes** dans Compass et supprimez uniquement
l'ancien index `apiKey_1` avant le premier redémarrage avec cette version.
Mongoose le recréera avec la configuration corrigée. Ne supprimez pas la
collection ni les index `email_1` et `username_1`.

Démarrez MongoDB, puis lancez l'API :

```powershell
npm start
```

Attendez les messages `Example app listening on port 5000` et
`Connected to MongoDB (database)` avant d'envoyer des requêtes. En cas
d'erreur de connexion à MongoDB, l'API répond `503` tant que la base n'est pas
prête.

## Routes

| Méthode | URL | Authentification |
| --- | --- | --- |
| `GET` | `/posts` | Aucune |
| `GET` | `/posts/:id` | Aucune |
| `POST` | `/auth/register` | Aucune |
| `POST` | `/auth/login` | Aucune |
| `POST` | `/generateApiKey` | Jeton Bearer |
| `POST` | `/posts/create` | Jeton Bearer et `x-api-key` |
| `PUT` | `/posts/update/:id` | Jeton Bearer |
| `DELETE` | `/posts/delete/:id` | Jeton Bearer |

Pour les exemples Postman, l'ordre des requêtes et les erreurs courantes,
consultez le [guide de test](./test.md).

## Tests

```powershell
npm test
```
