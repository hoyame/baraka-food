#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FORPROD="$ROOT/forprod"

cd "$ROOT"

echo "== Build ecrans/admin =="
npm run build

echo "== Build staff (salle/cuisine) =="
npm --prefix staff run build

echo "== Assemblage forprod =="
rm -rf "$FORPROD"
mkdir -p "$FORPROD/server"

cp -R dist "$FORPROD/dist"
cp server/index.js server/print-listener.js "$FORPROD/server/"

cp -R staff/.next/standalone "$FORPROD/staff"
mkdir -p "$FORPROD/staff/.next"
cp -R staff/.next/static "$FORPROD/staff/.next/static"
[ -d staff/public ] && cp -R staff/public "$FORPROD/staff/public"

cp .env "$FORPROD/.env"

cat > "$FORPROD/package.json" <<'EOF'
{
  "name": "baraka-food-prod",
  "private": true,
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.110.8",
    "express": "^5.2.1"
  }
}
EOF

cp "$ROOT/scripts/prod/demarrer.bat" "$FORPROD/demarrer.bat"
cp "$ROOT/scripts/prod/installer.bat" "$FORPROD/installer.bat"

echo "== Archive =="
cd "$ROOT"
rm -f forprod.zip
zip -qr forprod.zip forprod

echo ""
echo "forprod.zip pret. A copier sur le PC client, dezipper, puis lancer installer.bat (1ere fois) ou demarrer.bat."
