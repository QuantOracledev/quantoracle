#!/bin/bash
set -e
echo "=== Deploying QuantOracle API to DigitalOcean ==="

pip install fastapi uvicorn gunicorn --break-system-packages

mkdir -p /opt/quantoracle
cp api/quantoracle.py /opt/quantoracle/

cp deploy/nginx.conf /etc/nginx/sites-available/quantoracle
ln -sf /etc/nginx/sites-available/quantoracle /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

cp deploy/quantoracle.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable quantoracle
systemctl restart quantoracle

echo "=== API deployed! Testing... ==="
sleep 2
curl -s http://localhost:8000/health | python3 -m json.tool
echo ""
echo "=== Now deploy the Cloudflare Worker ==="
echo "cd worker && npm install && npx wrangler deploy"
