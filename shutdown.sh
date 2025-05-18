#!/bin/bash
# Shutdown script for blockvote.live Fabric-Supertoken application

BASE_DIR=/opt/fabric-supertoken/blockvote
BACKEND_DIR=$BASE_DIR/backend/asset-transfer-basic/application-gateway-javascript
NETWORK_DIR=$BASE_DIR/backend/test-network

# Stop PM2 processes
pm2 stop fabric-api
pm2 delete all

# Remove wallet directory
echo "Removing wallet directory..."
if [ -d "$BACKEND_DIR/src/wallet" ]; then
    rm -rf $BACKEND_DIR/src/wallet
    echo "✓ Wallet directory removed"
else
    echo "! Wallet directory not found"
fi

# Stop Docker containers
cd $BASE_DIR
docker-compose down -v

# Shutdown Fabric network
cd $NETWORK_DIR
./network.sh down

# Stop explorer
cd $BASE_DIR/explorer
docker-compose down -v
rm -rf ./organizations

echo "All services have been stopped."
