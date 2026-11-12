#!/usr/bin/env bash
set -euo pipefail
umask 077

archive=${1:?Falta el archivo de la versión}
[[ "$archive" =~ ^/tmp/atlasops-deploy\.[A-Za-z0-9]+/app\.tar\.gz$ ]]
release_dir=${archive%/*}
trap 'rm -rf -- "$release_dir"' EXIT

cd /opt/atlasops
exec 9>.deploy.lock
flock -w 60 9

database=$(docker exec transporte-prod-backend-1 node -p 'new URL(process.env.MONGODB_URI).pathname')
case "$database" in
  /transporte) override=compose.production.replica.yml ;;
  /transporte_prueba) override=compose.production.prueba.yml ;;
  *) echo 'Base activa desconocida. Se cancela el despliegue.' >&2; exit 1 ;;
esac

compose=(docker compose --env-file .env.production -f compose.production.yml -f "$override")
"${compose[@]}" config --quiet
command -v rsync >/dev/null
mkdir "$release_dir/source"
tar -xzf "$archive" --no-same-owner -C "$release_dir/source"
for service in backend frontend; do
  test -f "$release_dir/source/$service/Dockerfile"
done
for service in backend frontend; do
  rsync -a --delete --exclude=".env*" --exclude=node_modules --exclude=.next "$release_dir/source/$service/" "/opt/atlasops/$service/"
done
"${compose[@]}" build backend frontend
"${compose[@]}" up -d --no-deps --wait --wait-timeout 180 backend frontend
"${compose[@]}" ps backend frontend
curl --fail --silent --show-error --location --max-time 20 -o /dev/null https://atlasops.com.ar/landing

