#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=axis-orders-2025
REGION=us-central1
REPO=webservices
SERVICE=axis-orders
TAG=$(git rev-parse --short HEAD)

echo ">> Build imagen ${TAG}"
gcloud builds submit \
  --project "$PROJECT_ID" \
  --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG}

echo ">> Deploy a Cloud Run"
gcloud run deploy ${SERVICE} \
  --project "$PROJECT_ID" \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG} \
  --region ${REGION} \
  --no-allow-unauthenticated \
  --set-env-vars=NODE_ENV=production

echo ">> Verificando imagen activa"
gcloud run services describe $SERVICE \
  --region $REGION \
  --format='value(spec.template.spec.containers[0].image)'

SERVICE_URL=$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')
ID_TOKEN=$(gcloud auth print-identity-token)
echo ">> / (200 esperado)";  curl -s -i -H "Authorization: Bearer $ID_TOKEN" "$SERVICE_URL/" | head -n 1
echo ">> /hc (200 esperado)"; curl -s -i -H "Authorization: Bearer $ID_TOKEN" "$SERVICE_URL/hc" | head -n 1
