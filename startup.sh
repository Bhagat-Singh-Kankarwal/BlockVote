#!/bin/bash

# Production startup script for blockvote.live

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set base directory paths
BASE_DIR=/opt/fabric-supertoken/blockvote
NETWORK_DIR=$BASE_DIR/backend/test-network
BACKEND_DIR=$BASE_DIR/backend/asset-transfer-basic/application-gateway-javascript

# Function to display step information
step() {
    echo -e "${YELLOW}[$(date +%T)]${NC} $1"
}

# Function to check command execution status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}: $1"
    else
        echo -e "${RED}✗ Failed${NC}: $1"
        echo "Exiting..."
        exit 1
    fi
}

# Step 1: Start Fabric Network
step "Starting Hyperledger Fabric network..."
cd $NETWORK_DIR

# Bring down network if already running
./network.sh down > /dev/null 2>&1
echo "Network shutdown completed"

# Start the network with channel and CA
./network.sh up createChannel -c mychannel -ca > /dev/null 2>&1
check_status "Network started"

# Step 2: Deploy Chaincode
step "Deploying chaincode..."
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript/ -ccl typescript > /dev/null 2>&1
check_status "Chaincode deployed"

# Step 3: Start Supertoken services
step "Starting SuperTokens services..."
cd $BASE_DIR
docker-compose up -d
check_status "SuperTokens services started"

# Step 4: Install backend dependencies
step "Installing backend dependencies..."
cd $BACKEND_DIR
npm install --silent > /dev/null 2>&1
check_status "Backend dependencies installed"

# Step 5: Start the backend server with PM2
step "Starting backend server with PM2..."
# Only install PM2 if not already present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
    check_status "PM2 installed"
fi
pm2 delete fabric-api > /dev/null 2>&1 || true
pm2 start src/server.js --name "fabric-api"
pm2 save
check_status "Backend server started with PM2"

# Step 6: Start blockchain explorer
step "Starting blockchain explorer..."
cd $BASE_DIR/explorer
cat > .env << 'EOL'
PORT=8080
EXPLORER_CONFIG_FILE_PATH=./examples/net1/config.json
EXPLORER_PROFILE_DIR_PATH=./examples/net1/connection-profile
FABRIC_CRYPTO_PATH=/fabric-path/fabric-samples/test-network/organizations
EOL

cp -r ../backend/test-network/organizations/ .

# Rename the keystore file to priv_sk for Org1 Admin
ORG1_KEYSTORE_DIR="./organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
if [ -d "$ORG1_KEYSTORE_DIR" ]; then
    # Find the key file (should be only one) and rename it to priv_sk
    KEYFILE=$(ls $ORG1_KEYSTORE_DIR/* | head -1)
    if [ -n "$KEYFILE" ]; then
        mv "$KEYFILE" "$ORG1_KEYSTORE_DIR/priv_sk"
        check_status "Renamed Org1 Admin keystore file to priv_sk"
    else
        echo -e "${YELLOW}Warning${NC}: No keystore file found for Org1 Admin"
    fi
else
    echo -e "${YELLOW}Warning${NC}: Keystore directory not found for Org1 Admin"
fi

# Start the explorer
docker-compose up -d
check_status "Blockchain explorer started"

echo
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}Blockchain voting system started successfully!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo
echo -e "${YELLOW}API is available at https://api.blockvote.live${NC}"
echo -e "${YELLOW}Note: To check status, run: pm2 status${NC}"
echo
