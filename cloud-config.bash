#!/bin/bash

# Cloud-init script for DigitalOcean - Fabric-Supertoken setup

# Log file setup
exec > >(tee -a /var/log/cloud-init-output.log) 2>&1
echo "Starting Fabric-Supertoken installation at $(date)"

# Update system packages
apt update && apt upgrade -y
apt install -y docker-compose curl gnupg lsb-release ufw debian-keyring debian-archive-keyring apt-transport-https

# Install NVM & Node.js first (before using npm)
echo "Installing NVM and Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install v22.14.0
nvm use v22.14.0


# Create project directory
echo "Setting up project directory..."
mkdir -p /opt/fabric-supertoken
cd /opt/fabric-supertoken

git clone https://github.com/Bhagat-Singh-Kankarwal/blockvote.git

# Update binaries
echo "Installing Hyperledger Fabric binaries..."
cd blockvote/backend/
chmod +x ./install-fabric.sh
./install-fabric.sh d b

# Frontend setup
echo "Setting up frontend..."
cd /opt/fabric-supertoken/blockvote/frontend
cat > /opt/fabric-supertoken/blockvote/frontend/.env << 'EOL'
VITE_API_URL=https://api.blockvote.live
VITE_WEBSITE_DOMAIN=https://blockvote.live
EOL

# Install dependencies and build
echo "Building frontend application..."
npm install
npm install terser
npm run build

# Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9010/tcp
ufw --force enable

# Install Caddy
echo "Installing Caddy web server..."
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

# Configure Caddy
echo "Configuring Caddy..."
cat > /etc/caddy/Caddyfile << 'EOF'
blockvote.live, www.blockvote.live {
    root * /opt/fabric-supertoken/blockvote/frontend/dist
    encode gzip
    file_server
    try_files {path} /index.html
}

api.blockvote.live {
    # Special test path
    handle /caddy-test {
        respond "Caddy server for blockvote.live is working correctly! {time.now}"
    }
    
    # Forward everything else to your app
    handle {
        reverse_proxy localhost:9010 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF

systemctl restart caddy

# Create .env file for the application
echo "Configuring application environment..."
cat > /opt/fabric-supertoken/blockvote/backend/asset-transfer-basic/application-gateway-javascript/.env << 'EOL'
SUPERTOKENS_URI=http://localhost:3567
API_DOMAIN=https://api.blockvote.live
WEBSITE_DOMAIN=https://blockvote.live
PORT=9010
EOL

# Update CORS settings in server.js
echo "Updating CORS settings..."
sed -i "s|origin: \['http://localhost:5173'\]|origin: \['https://blockvote.live'\]|" /opt/fabric-supertoken/blockvote/backend/asset-transfer-basic/application-gateway-javascript/src/server.js


echo "Installation completed at $(date)"
