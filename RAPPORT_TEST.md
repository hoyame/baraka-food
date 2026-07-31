# Rapport de test — Baraka Food

**Passe 1 :** 26/07/2026 — test complet des 9 sections
**Passe 2 (contre-test) :** 26/07/2026 — vérification des correctifs + non-régression
**Environnement :** macOS, Chrome desktop, un onglet par app
**Apps :** `4010` (écrans + admin), `4020` (vitrine), `4030` (client), `4040` (salle + cuisine)
**Projet Supabase :** `dunywwhlojoeeuvxbqtn`

---

# PARTIE A — Contre-test des correctifs

| Point | Passe 1 | Passe 2 | Verdict |
|---|---|---|---|
| §7.1 Client figé après « Récupérée » | ❌ bloquant | ✅ **corrigé, vérifié en direct** | ✅ |
| §7.2 « Introuvable » au lieu de « Récupérée » | ⚠️ | ✅ **corrigé, vérifié** | ✅ |
| §4.1 Doublon « Jambon de poulet fumé » | ⚠️ | ✅ **corrigé, vérifié** | ✅ |
| §4.2 Libellés Accompagnements ambigus | ⚠️ | ✅ **corrigé, vérifié** | ✅ |
| §4.3 Quantité non bornée | ⚠️ | ✅ **corrigé, vérifié (borne haute ET basse)** | ✅ |
| §1.1 Replay de l'animation d'entrée | ⚠️ | ⏳ **code correct, non mesurable ici** | à confirmer à l'œil |

---

## §7.1 — Client figé après « Récupérée » → ✅ CORRIGÉ

Cycle complet rejoué de bout en bout sur la commande **C10**, avec salle + cuisine + client ouverts simultanément, **sans aucun rechargement** :

| Action | Client `/C10` |
|---|---|
| Envoi depuis la salle | `COMMANDE ENREGISTRÉE` |
| « Démarrer » (cuisine) | `EN PRÉPARATION` |
| « Prêt » (cuisine) | `BIENTÔT PRÊTE` |
| « Mettre au comptoir » (salle) | `VOTRE COMMANDE EST PRÊTE !` + bip + vibration (`ctx:running`, `vibrate` tracés) |
| **« Récupérée » (salle)** | **`COMMANDE RÉCUPÉRÉE` / « Merci et bon appétit ! »** ✅ |

Le passage à l'état final est arrivé en direct, en ~2 s, sans rechargement. Le comportement décrit en passe 1 (page bloquée indéfiniment sur « Votre commande est prête ! ») **n'est plus reproductible**.

### §7.2 — Distinction « récupérée » vs « introuvable » → ✅ CORRIGÉ

Le garde `wasFound` fait bien la différence entre les deux cas, vérifié dans les deux sens :

- `/C10` observé pendant son cycle puis supprimé → `COMMANDE RÉCUPÉRÉE / Merci et bon appétit !` ✅
- `/Z99` jamais existant → `COMMANDE INTROUVABLE / Vérifiez le numéro avec le comptoir.` ✅

*Note : un client qui ouvre `/C10` **après** la suppression (nouveau chargement, `wasFound` à false) verra « Commande introuvable ». C'est le comportement attendu — sans ligne en base, rien ne permet de distinguer « déjà récupérée » de « n'a jamais existé ».*

---

## §4.1 / §4.2 — Catalogue salle → ✅ CORRIGÉS

Les 6 catégories relues après rechargement :

- **Suppléments** : 10 articles au lieu de 11, **plus aucun doublon** de « Jambon de poulet fumé ». ✅
- **Accompagnements** : `Frites Moyenne 3,50 €`, `Frites Grande 4,50 €`, `Tiramisu 3,00 €`, `Boisson 33cl 1,50 €`, `Boisson 50cl 2,00 €`. ✅

**Vérification du risque de sur-dédoublonnage** (le point qui aurait pu casser) : le `Set` est bien instancié **par catégorie**, pas globalement. « Crunchy » apparaît donc toujours à la fois dans Burgers (7,00 €) et dans Sandwichs (7,00 €), comme avant. ✅ Aucune perte d'article ailleurs : Burgers 3, Tex-Mex 6, Sandwichs 7, Accompagnements 5, Tacos 3.

## §4.3 — Plafond de quantité → ✅ CORRIGÉ

| Saisie | Résultat | Total ligne |
|---|---|---|
| `99` | ramené à **20** | 160,00 € (cohérent) |
| `0` | ramené à **1** | 8,00 € (cohérent) |

L'attribut `max=20` est présent sur le champ et le clamp `Math.min(20, Math.max(1, …))` s'applique aussi à la borne basse — bien vu, ça n'était pas demandé mais un `0` aurait produit une ligne à 0 €.

---

## §1.1 — Replay de l'animation d'entrée → ⏳ NON VÉRIFIABLE DANS MON ENVIRONNEMENT

**Je ne peux pas confirmer ce point, et je préfère le dire plutôt que de cocher une case.**

Les onglets pilotés à distance restent en `document.visibilityState === "hidden"` : Chrome ne les peint jamais et **`requestAnimationFrame` ne tourne pas du tout**. Or framer-motion anime via rAF. Résultat : dans mon environnement, aucune animation ne se joue jamais, ni à l'entrée ni au replay — j'ai mesuré `frames = 0` sur 14 s d'échantillonnage rAF. Le test ne peut donc ni confirmer ni infirmer le correctif.

**Ce que j'ai pu établir malgré tout :**

1. **Relecture du code** — la logique est correcte. `hasEntered` est un `useRef` passé à `true` dans un `useEffect` après le premier rendu où `menu` est non-null. Premier rendu utile → `initial={{opacity:0,…}}` (l'animation joue) ; tous les rendus suivants, y compris ceux déclenchés par Realtime → `initial={false}` (framer saute l'entrée). Le flag est bien présent et câblé de façon identique sur les 3 écrans (`Menu1/2/3`, 3 points d'ancrage chacun).
2. **Mise à jour Realtime observée** — lors d'un changement de prix (8,00 € → 8,40 €), le `MutationObserver` posé sur `#root` n'a enregistré **aucune écriture de style** sur les cartes. C'est cohérent avec un replay supprimé, mais ce n'est pas une preuve : dans un onglet caché framer n'écrit de toute façon rien.

**À faire de votre côté (30 secondes) :** ouvrez `/1` sur un vrai écran au premier plan, laissez l'animation d'entrée se terminer, puis changez un prix dans l'admin. Si seul le prix change et que les cartes ne refont pas leur fondu, c'est réglé.

### ⚠️ Observation annexe (issue de cette mesure)

Sur un onglet **caché**, `/2` reste bloqué avec **11 éléments sur 36 à `opacity: 0`** — l'animation d'entrée n'ayant jamais démarré, ils ne deviennent jamais visibles. En production l'impact est *a priori* nul : dès que l'onglet passe au premier plan, rAF redémarre et l'animation se termine. Mais le principe reste fragile pour un écran kiosque : l'état visible par défaut dépend d'une animation JS.

Si vous voulez blinder : que l'état **final** (opacity 1) soit celui du CSS, et que framer ne fasse qu'*ajouter* le fondu. Comme ça, animation ou pas, le menu s'affiche.

---

# PARTIE B — Non-régression (passe 2)

Tout ce qui était vert en passe 1 a été recontrôlé après les correctifs.

| Zone | Contrôle | Résultat |
|---|---|---|
| Écrans `/1` `/2` | Contenu, prix, structure | ✅ conformes |
| Realtime écrans | Prix modifié en base → `/1` mis à jour sans rechargement | ✅ (~1,5 s) |
| Admin après F5 | Session staff rétablie, 2 sauvegardes → « Enregistré ✓ » | ✅ sans écran de login |
| Vitrine | 16 images, **0 cassée**, prix à jour, onglets OK | ✅ |
| Salle | Catalogue complet, ticket, total, envoi | ✅ |
| Numérotation | C10 attribué à la suite de C9, sans trou ni doublon | ✅ |
| Cuisine | En attente → En préparation → Prêt en cuisine | ✅ |
| Salle après cuisine | Alerte fond clair + `pulse`, « Mettre au comptoir », « Récupérée » | ✅ |
| Synchro 3 écrans | Cycle complet C10, aucun rechargement | ✅ |
| Console JS | Aucune erreur sur les 5 apps | ✅ |
| Table `orders` | Vide en fin de test | ✅ |

## Sécurité — recontrôlée, toujours verrouillée

| Opération (clé anon seule) | Résultat |
|---|---|
| `GET /rest/v1/orders` | 200 ✅ lecture publique |
| `POST /rest/v1/orders` | **401** ✅ bloqué |
| `PATCH /rest/v1/menu` (`Prefer: return=representation`) | 200 **`[]` — 0 ligne modifiée** ✅ bloqué |

Rappel méthodo : un `PATCH`/`DELETE` bloqué par RLS renvoie **200/204, pas 403**. Toujours ajouter `Prefer: return=representation` — le `[]` est la seule preuve fiable.

---

# PARTIE C — Points ouverts (non traités, pour mémoire)

Aucun n'est bloquant, aucun n'était annoncé comme corrigé.

| # | Point | Sévérité |
|---|---|---|
| 1 | **§1.1 à confirmer à l'œil** sur un écran au premier plan (cf. Partie A) | à vérifier |
| 2 | ~~Catalogue salle non temps réel~~ → **corrigé et vérifié en passe 3** (cf. Partie D) | ✅ résolu |
| 2b | ~~Un article déjà au ticket n'est pas signalé s'il passe épuisé~~ → **corrigé et vérifié en passe 4** (cf. Partie E) | ✅ résolu |
| 2c | ~~Faux positif « épuisé » sur les noms présents dans deux catégories~~ → **corrigé et vérifié en passe 5** (cf. Partie F) | ✅ résolu |
| 3 | **Vitrine non temps réel** (SSR `force-dynamic`, pas d'abonnement) — un onglet client resté ouvert affiche un prix périmé | faible |
| 4 | **Cartes cuisine : heure de création, pas chrono** — `00:25` est l'heure de prise de commande. Un temps d'attente écoulé serait plus utile en coup de feu. | faible / à décider |
| 5 | **Bip + vibration non validés sur téléphone réel** — vérifiés uniquement sur Chrome desktop (`AudioContext` en `running`, `navigator.vibrate` appelé). Sur **iOS Safari**, `navigator.vibrate` n'existe pas (pas de vibration) et l'`AudioContext` démarre `suspended` sans geste utilisateur : si le client arrive par QR code directement sur `/CXX` sans jamais toucher l'écran, **le bip risque de ne pas sortir**. Un `ctx.resume()` au premier `touchstart` lèverait le doute. | à tester sur iPhone |

---

---

# PARTIE D — Passe 3 : catalogue salle en temps réel

**Correctif annoncé :** canal Realtime sur la table `menu` dans `staff/salle`, qui redéclenche `loadCatalog()`.

## ✅ Vérifié — le correctif fonctionne dans les deux sens

Test dans les conditions réelles (bascule depuis l'**admin**, pas en base directe), **tablette salle jamais rechargée** :

| Action dans l'admin | Catalogue salle |
|---|---|
| « Kefta ou Poulet » → ÉPUISÉ + Enregistrer | **disparaît en direct** ✅ (3 burgers → 2) |
| « Kefta ou Poulet » → DISPO + Enregistrer | **réapparaît en direct** ✅ (latence ≤ 1 s) |
| Prix 8,00 € → 8,60 € + Enregistrer | **prix à jour en direct** ✅ |

*La latence mesurée est de 1 s, mais c'est le plancher de mesure : mon échantillonneur est bridé à ~1 Hz dans un onglet en arrière-plan. La latence réelle est inférieure.*

## ✅ Non-régression

- **Le ticket en cours est préservé** à chaque rechargement du catalogue — vérifié sur les 3 bascules ci-dessus. C'était le vrai risque du correctif (un `setState` mal placé aurait vidé le panier d'un serveur en plein encaissement) : rien ne bouge. ✅
- **Pas de fuite d'abonnement** : `fetch` instrumenté sur la page salle → **exactement 1 rechargement du catalogue par événement `menu`**. Pas de canal dupliqué, pas d'effet monté deux fois. ✅
- Commandes toujours en temps réel : C11 envoyée depuis la salle, reçue instantanément en cuisine. ✅
- Numérotation continue (C10 → C11), aucune erreur console sur la salle. ✅

## ⚠️ Nouveau point mis en lumière par le correctif

**Un article déjà présent dans le ticket n'est pas signalé quand il passe épuisé.**

Scénario reproduit :

1. Le serveur ajoute « Kefta ou Poulet » au ticket.
2. La cuisine passe l'article en épuisé depuis l'admin.
3. L'article disparaît bien du catalogue ✅ **mais reste dans le ticket, sans aucune alerte visuelle.**
4. « Envoyer en cuisine » part sans broncher → **commande C11 créée et affichée en cuisine avec un article en rupture.**

Ce n'est pas une régression : avant le correctif le problème existait aussi (en pire, l'article restait même proposé au catalogue). Mais maintenant que la salle *sait* en direct qu'un article est épuisé, ne pas s'en servir pour le ticket en cours est un manque.

*Piste :* au rechargement du catalogue, marquer en rouge les lignes du ticket dont le nom n'est plus dans le catalogue, avec un message « épuisé — retirer ? ». Bloquer l'envoi serait probablement trop rigide en coup de feu.

---

# PARTIE E — Passe 4 : signal « épuisé » sur le ticket en cours

**Correctif annoncé :** `unavailableNames` construit à chaque `loadCatalog()` avant le filtre de disponibilité ; ligne de ticket concernée affichée en rouge avec « Épuisé — retirer ? », sans bloquer l'envoi.

## ✅ Vérifié — le cas nominal fonctionne

Tablette salle jamais rechargée, bascule depuis l'admin :

| Étape | Ticket |
|---|---|
| Kefta + Poulet Mariné ajoutés | 2 lignes normales, 0 alerte |
| Kefta → ÉPUISÉ dans l'admin | **ligne Kefta seule passe en alerte, en direct** ✅ |
| Kefta → DISPO dans l'admin | **alerte disparaît, en direct** ✅ |

Rendu mesuré sur la ligne en alerte : fond `rgba(255,90,90,0.12)`, bordure et texte `rgb(255,90,90)`, mention « ÉPUISÉ — RETIRER ? ». La deuxième ligne du ticket reste strictement inchangée (fond `rgb(22,22,22)`) — **pas de contamination visuelle**. ✅

« Envoyer en cuisine » reste actif et cliquable, conformément à la demande. ✅

## ⚠️ Faux positif sur les noms partagés entre deux catégories

`unavailableNames` est un `Set` de **noms nus**, alors que le dédoublonnage du catalogue, lui, est scopé **par catégorie**. Les deux logiques divergent dès qu'un nom existe dans deux catégories — c'est le cas de « Crunchy », présent à la fois en Burgers (8ᵉ) et en Sandwichs (7,00 €).

Scénario reproduit :

1. Le serveur ajoute **Crunchy depuis la catégorie Sandwichs** au ticket.
2. La cuisine passe le **Crunchy burger** en épuisé (le sandwich reste disponible).
3. Résultat côté salle :
   - catalogue **Burgers** → Crunchy retiré ✅ (correct)
   - catalogue **Sandwichs** → Crunchy toujours proposé ✅ (correct)
   - **ligne de ticket Crunchy → marquée « ÉPUISÉ — RETIRER ? »** ❌ (faux)

L'écran se contredit : il propose l'article au catalogue et le déclare épuisé au ticket. Le serveur peut même le re-cliquer et voir la ligne rouge réapparaître aussitôt.

**Sévérité faible** : un seul nom concerné dans le menu actuel (« Crunchy »), et le signal reste consultatif — l'envoi n'est pas bloqué. Mais c'est le genre de détail qui use la confiance dans l'alerte : un serveur qui voit deux ou trois faux « épuisé » arrête de les lire.

**Correctif le plus simple** — retirer du `Set` les noms qui restent servis quelque part, juste après avoir construit `cats` :

```ts
const availableNames = new Set(cats.flatMap((c) => c.items.map((i) => i.name)))
for (const n of unavailable) if (availableNames.has(n)) unavailable.delete(n)
setUnavailableNames(unavailable)
```

Un article n'est alors marqué épuisé que s'il n'est plus disponible **nulle part** — ce qui supprime la contradiction avec le catalogue sans toucher au modèle de données. *(La solution exacte serait d'indexer par couple catégorie + nom et de mémoriser la catégorie d'origine sur la ligne de ticket, mais ça demande de modifier `addToCart` pour un gain marginal.)*

## ✅ Non-régression (passe 4)

- Catalogue toujours en temps réel dans les deux sens. ✅
- Ticket préservé à chaque rechargement du catalogue. ✅
- Retrait des lignes, recalcul du total, envoi en cuisine : inchangés. ✅
- Aucune erreur console. ✅

---

# PARTIE F — Passe 5 : faux positif « épuisé » corrigé

**Correctif annoncé :** un nom n'est marqué épuisé que s'il n'est disponible dans **aucune** catégorie.

## ✅ Les trois cas de la table de vérité passent

Un seul ticket contenant **Crunchy** (ajouté depuis Sandwichs) et **Kefta ou Poulet**, tablette jamais rechargée :

| État en base | Catalogue | Ligne de ticket | Attendu |
|---|---|---|---|
| Crunchy burger ÉPUISÉ, Crunchy sandwich DISPO | retiré des Burgers, gardé en Sandwichs | **pas d'alerte** ✅ | le faux positif a disparu |
| Crunchy ÉPUISÉ **partout** (burger + sandwich) | retiré des deux | **alerte** ✅ | le vrai cas n'est pas masqué |
| Kefta ÉPUISÉ (présent dans une seule catégorie) | retiré des Burgers | **alerte** ✅ | cas nominal préservé |

Le test le plus parlant est le dernier état, où les deux lignes coexistent **dans le même ticket au même instant** : Kefta en rouge avec « ÉPUISÉ — RETIRER ? », Crunchy strictement normal. La discrimination se fait bien ligne par ligne, sans contamination.

C'était le vrai risque du correctif — supprimer le faux positif en masquant aussi les vraies alertes. Ce n'est pas le cas : `availableNames` est bien construit à partir de `cats` (donc après filtrage), et un article épuisé partout disparaît de `cats`, donc reste dans `unavailable`.

## ✅ Non-régression (passe 5)

- Catalogue temps réel, dans les deux sens, sur les 5 bascules du test. ✅
- Ticket préservé à chaque rechargement du catalogue. ✅
- Retrait des lignes, recalcul du total, envoi en cuisine : inchangés. ✅
- Aucune erreur console. ✅

---

## Notes de nettoyage

- Tous les articles remis **disponibles** (0 article épuisé en base), prix « Kefta ou Poulet » à **8,00 €**.
- Ticket salle vidé, table `orders` vide.
- Table `orders` vide (C10 et C11 supprimées).
- Séquence `order_code_seq` : prochaine commande réelle = **C12**.
- Aucun fichier de test résiduel à la racine.
