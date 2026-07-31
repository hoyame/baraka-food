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
| `website/` | Site vitrine (menu public) |
| `client/` | Suivi de commande côté client — `/` pour saisir le numéro, `/CXX` pour suivre une commande précise |

## En développement (`npm run dev` dans chaque dossier)

| App | Port |
|---|---|
| Écrans + Admin (`src/`, Vite) | `4010` |
| Site vitrine (`website/`) | `4020` |
| Client (`client/`) | `4030` |
| Staff — salle + cuisine (`staff/`) | `4040` |
