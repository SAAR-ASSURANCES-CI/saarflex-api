#!/bin/bash

docker image prune -f

docker compose -f docker-compose.prod.yml up -d --build

echo "Deployment completed successfully"