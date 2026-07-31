# Prompt de test — Baraka Food (menu board + commandes + site vitrine)

Tu es en train de tester un système multi-apps pour un restaurant, connecté à un projet Supabase commun. Suis les étapes dans l'ordre, coche mentalement chaque point, et note tout ce qui ne correspond pas au comportement attendu (avec capture d'écran si possible).

## Setup préalable

Lance les 4 apps en parallèle (ports différents) :

```
npm run dev          # écrans + admin, http://localhost:5173 (ou 4010 selon config)
cd website && npm run dev   # site vitrine, http://localhost:4020
cd client && npm run dev    # page client, http://localhost:4030
cd staff && npm run dev     # salle + cuisine, http://localhost:4040
```

Ouvre-les si possible sur des appareils/onglets/navigateurs différents pour bien simuler l'usage réel (tablette salle, tablette cuisine, téléphone client, écran TV).

---

## 1. Écrans menu board (`/1`, `/2`, `/3`)

- Ouvre les 3 écrans. Vérifie que les images, prix, et textes correspondent au menu actuel.
- Laisse tourner 1-2 minutes : vérifie que les animations (flottement des images, mise en avant tour à tour) fonctionnent sans erreur JS dans la console.
- Depuis l'admin (étape 2), modifie un prix : vérifie que l'écran se met à jour **sans recharger la page**, en quelques secondes.

## 2. Admin (`/admin`)

- Vérifie que le menu se charge correctement à l'ouverture.
- Modifie le prix d'un article, sauvegarde. Vérifie la mise à jour sur les écrans (étape 1) et le site vitrine (étape 3).
- Passe un article en "indisponible", sauvegarde. Vérifie qu'il disparaît/se grise sur les écrans, le site vitrine, et le catalogue de la salle (étape 4).
- Remets-le disponible.
- Uploade une nouvelle image sur un article existant. Vérifie qu'elle s'affiche correctement partout après sauvegarde.
- Recharge complètement la page admin (F5) : vérifie que tu peux toujours sauvegarder sans erreur (la session staff doit se rétablir automatiquement, sans écran de login visible).

## 3. Site vitrine (`website/`)

- Vérifie que la page d'accueil affiche la marque et le menu à jour.
- Clique sur chaque onglet (Burgers / Sandwichs / Tacos) : vérifie qu'une seule catégorie s'affiche à la fois et que le contenu correspond.
- Réduis la fenêtre du navigateur (ou ouvre sur mobile) : vérifie que la mise en page reste utilisable (responsive).
- Vérifie qu'un article marqué indisponible depuis l'admin n'apparaît pas ou apparaît clairement grisé.

## 4. Salle (`staff/salle`)

- Vérifie que les catégories du catalogue (Burgers, Tex-Mex, Sandwichs, Accompagnements, Tacos, Suppléments) affichent les bons articles et prix, à jour avec l'admin.
- Vérifie qu'un article rendu indisponible dans l'admin **n'apparaît pas** dans ce catalogue.
- Ajoute 2-3 articles différents au ticket. Modifie une quantité. Ajoute une note texte libre sur un article (ex: "sans oignon, + sauce algérienne").
- Retire un article du ticket avant envoi, vérifie qu'il disparaît bien et que le total se recalcule.
- Clique "Envoyer en cuisine". Vérifie qu'un numéro de commande s'affiche en confirmation (format CXX).
- Vérifie que la commande apparaît immédiatement dans "Commandes en cours" avec le statut "En attente".
- Répète l'envoi 2-3 fois de suite rapidement : vérifie que chaque commande reçoit un numéro unique et incrémental, sans doublon ni collision.

## 5. Cuisine (`staff/cuisine`)

- Vérifie que la commande envoyée depuis la salle (étape 4) apparaît dans la colonne "En attente", avec le bon détail d'articles et les notes visibles.
- Clique "Démarrer" : vérifie qu'elle passe dans la colonne "En préparation".
- Clique "Prêt" : vérifie qu'elle passe dans la colonne "Prêt en cuisine".
- Vérifie que tout ça se reflète **en direct** sur l'écran salle (étape 6) sans action de ta part sur cet écran.

## 6. Retour salle après cuisine

- Sur l'écran salle, vérifie que dès qu'une commande passe "Prêt en cuisine", elle apparaît en alerte visuelle distincte (fond clair / clignotant) dans "Commandes en cours".
- Clique "Mettre au comptoir" : vérifie que le statut passe à "Disponible au comptoir" et que l'alerte visuelle s'arrête.
- Vérifie qu'un bouton "Récupérée" apparaît maintenant sur cette commande.
- Clique "Récupérée" : vérifie que la commande disparaît complètement de la liste (elle est supprimée en base, pas juste masquée).

## 7. Client (`client/`)

- Avant de cliquer "Récupérée" à l'étape 6, ouvre `client/` sur un téléphone si possible (sinon un navigateur séparé), saisis le numéro de la commande en cours.
- Vérifie la progression du texte affiché au fil des étapes précédentes : "Commande enregistrée" → "En préparation" → "Bientôt prête" → **"Votre commande est prête !"** (fond clair) — chaque changement doit apparaître **sans recharger la page**.
- Sur téléphone : vérifie que le bip sonore et la vibration se déclenchent au moment exact où ça passe "prête".
- Saisis un numéro inexistant (ex: "Z99") : vérifie le message "Commande introuvable".
- Clique "Changer de numéro" : vérifie le retour à la page de saisie.
- Après avoir cliqué "Récupérée" côté salle (étape 6), vérifie ce qui s'affiche côté client (la commande n'existe plus en base).

## 8. Sécurité

- Sur `client/` ou `website/`, ouvre les devtools du navigateur (F12) → onglet Réseau → trouve une requête vers `supabase.co` → récupère l'URL et la clé `apikey` utilisée.
- Depuis la Console du navigateur, essaie un appel `fetch` en `POST`, `PATCH` ou `DELETE` vers `https://<projet>.supabase.co/rest/v1/orders` ou `/menu` avec cette clé.
- Vérifie que ça échoue (erreur 401/403, "row-level security policy").
- Vérifie qu'un simple `GET` (lecture) avec la même clé fonctionne bien (comportement attendu : lecture publique OK, écriture bloquée).

## 9. Test de synchro multi-appareils (le plus important)

- Ouvre simultanément : `staff/salle` sur un appareil, `staff/cuisine` sur un deuxième, `client/CXX` sur un troisième.
- Crée une commande depuis la salle et fais-la avancer jusqu'à "Récupérée" en suivant tout le cycle.
- Vérifie que les 3 écrans se mettent à jour **en temps réel, simultanément, sans qu'aucun ne soit rechargé manuellement**.

---

## Rapport attendu

Pour chaque section, indique : ✅ OK / ❌ KO (avec description précise du problème) / ⚠️ Comportement inattendu mais pas bloquant. Précise le navigateur/appareil utilisé pour les tests mobiles (bip/vibration).
