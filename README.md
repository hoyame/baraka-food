# Baraka Food — URLs

## En local sur la machine du restaurant (démarré via `demarrer.bat`)

Remplace `<IP-LAN>` par l'IP locale de la machine (affichée automatiquement au lancement du `.bat`), pour y accéder depuis n'importe quel appareil sur le même réseau Wi-Fi.

| App | Local (sur la machine) | Réseau local (LAN) |
|---|---|---|
| Écrans menu board 1/2/3 | `http://localhost:4000/1`, `/2`, `/3` | `http://<IP-LAN>:4000/1`, `/2`, `/3` |
| Admin (édition du menu) | `http://localhost:4000/admin` | `http://<IP-LAN>:4000/admin` |
| Salle (création commande + comptoir) | `http://localhost:4040/salle` | `http://<IP-LAN>:4040/salle` |
| Cuisine (suivi des commandes) | `http://localhost:4040/cuisine` | `http://<IP-LAN>:4040/cuisine` |

## Hébergées (site public, à héberger séparément — Vercel ou autre)

| App | Description |
|---|---|
| `submodules/barakafood-website/` | Site vitrine (menu public, horaires, flyers imprimables) |
| `client/` | Suivi de commande côté client — `/` pour saisir le numéro, `/CXX` pour suivre une commande précise |

## En développement (`npm run dev` dans chaque dossier)

| App | Port |
|---|---|
| Écrans + Admin (`src/`, Vite) | `4010` |
| Site vitrine (`submodules/barakafood-website/`) | `4020` |
| Client (`client/`) | `4030` |
| Staff — salle + cuisine (`staff/`) | `4040` |

## Flyers imprimables (servis par le site vitrine)

| Format | URL |
|---|---|
| Dépliant 2 volets, A4 paysage ×2 | `/flyer` |
| Affiche recto, A4 portrait | `/flyer/affiche` |

Un lien en haut de chaque page permet de passer de l'une à l'autre. Le contenu provient de Supabase : il suit ce qui est édité dans l'Admin.
