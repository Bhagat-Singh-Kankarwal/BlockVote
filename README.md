# BlockVote - Secure Blockchain Voting Platform

A comprehensive blockchain-based voting application leveraging Hyperledger Fabric and SuperTokens authentication.

## Project Overview

BlockVote is a modern, secure, and transparent electronic voting platform built on Hyperledger Fabric blockchain technology. The system combines robust identity management with homomorphic encryption to ensure ballot privacy while maintaining public verifiability.

## Key Features

- **Secure Blockchain-Based Voting**: Votes are encrypted with homomorphic encryption and stored on a tamper-proof blockchain ledger
- **Advanced Identity Management**: SuperTokens authentication integrated with Fabric CA for secure identity management
- **Comprehensive Election Management**: Admin tools to create, manage, and monitor elections
- **Tamper-Proof Results**: Secure tallying with zero-knowledge proofs while preserving voter privacy
- **User-Friendly Interface**: Intuitive React frontend with responsive design for all devices
- **Multi-level Authentication**: Separate secure login systems for voters and administrators

## System Architecture

The application implements a full-stack architecture:

1. **Hyperledger Fabric Network**
   - Channel: `mychannel`
   - Organizations: `Org1`, `Org2`
   - Smart Contract: TypeScript-based voting contract

2. **Node.js Backend**
   - Express.js REST API
   - Fabric Gateway SDK integration
   - SuperTokens authentication middleware
   - Homomorphic encryption services

3. **React Frontend**
   - Modern UI built with React 18 and Vite
   - TailwindCSS and Framer Motion for styling
   - Chart.js for data visualization
   - Responsive design for all devices

4. **Authentication System**
   - SuperTokens Core service
   - Email/password authentication
   - Session management
   - Integration with Fabric CA for identity management

5. **Security Components**
   - JWT tokens for admin authentication
   - Fabric CA for certificate management
   - Zero-knowledge proofs for vote verification
   - Homomorphic encryption for vote privacy

## Technology Stack

### Frontend
- **Framework**: React 18, Vite 6
- **UI/Styling**: TailwindCSS, Framer Motion
- **Authentication**: SuperTokens
- **Data Visualization**: Chart.js
- **Icons**: React Icons, Heroicons
- **API Integration**: Axios
- **Routing**: React Router
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Blockchain**: Hyperledger Fabric
- **Authentication**: SuperTokens
- **Encryption**: Homomorphic encryption libraries
- **API**: RESTful endpoints
- **Communication**: gRPC (Fabric)

## Project Structure

```
/
├── README.md                # Project overview
├── cloud-config.bash        # Cloud configuration script
├── docker-compose.yaml      # Docker services configuration
├── install-fabric.sh        # Fabric installation script
├── explorer/                # Blockchain explorer configuration
├── fabric-samples/          # Hyperledger Fabric components
│   ├── asset-transfer-basic/
│   │   ├── application-gateway-javascript/  # Backend application
│   │   └── chaincode-typescript/            # Smart contract
│   ├── test-network/        # Fabric test network
│   └── ...                  # Other Fabric components
└── frontend/                # React frontend application
    ├── src/
    │   ├── App.jsx          # Main application component
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Top-level page components
    │   └── utils/           # Utility functions
    └── ...                  # Configuration files
```

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- npm
- Docker and Docker Compose
- Git

### Setting Up the Blockchain Network

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Set up the Fabric network** (from the `fabric-samples/test-network` folder):
   ```bash
   ./network.sh up createChannel -c mychannel -ca
   ```

3. **Deploy the smart contract** (from the `fabric-samples/test-network` folder):
   ```bash
   ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript/ -ccl typescript
   ```

### Setting Up the Backend

1. **Configure environment variables** (create a `.env` file in the `fabric-samples/asset-transfer-basic/application-gateway-javascript` folder):
   ```
   SUPERTOKENS_URI=http://localhost:3567
   API_DOMAIN=http://localhost:9010
   WEBSITE_DOMAIN=http://localhost:5173
   PORT=9010
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=adminpw
   ```

2. **Run the SuperTokens service** (using Docker):
   ```bash
   docker run -d \
     --name supertokens \
     -p 3567:3567 \
     -e DISABLE_TELEMETRY=true \
     registry.supertokens.io/supertokens/supertokens-node
   ```

3. **Start the backend application** (from the `fabric-samples/asset-transfer-basic/application-gateway-javascript` folder):
   ```bash
   cd fabric-samples/asset-transfer-basic/application-gateway-javascript
   npm install
   npm start
   ```

### Setting Up the Frontend

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (create a `.env` file in the frontend root directory):
   ```
   VITE_API_URL=http://localhost:9010
   VITE_WEBSITE_DOMAIN=http://localhost:5173
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application** at [http://localhost:5173](http://localhost:5173)

## API Endpoints

The backend exposes the following key endpoints:

### Authentication Endpoints
- `POST /auth/signup`: Register a new user
- `POST /auth/signin`: Sign in with email and password
- `POST /fabric/register`: Register a logged-in user with Fabric CA
- `POST /fabric/admin/login`: Admin login for blockchain management

### Voting Endpoints
- `GET /elections`: Get all elections
- `GET /elections/active`: Get currently active elections
- `POST /admin/elections`: Create a new election (admin only)
- `POST /elections/:electionID/vote`: Cast a vote in an election
- `GET /elections/:electionID/results`: Get election results when available

### Admin Endpoints
- `POST /initLedger`: Initialize the ledger (admin only)
- `POST /admin/initialize-encryption`: Set up encryption system (admin only)
- `GET /fabric/admin/status`: Check admin enrollment status

## User Flow

1. **Voter Registration**: Users create an account with secure identity verification
2. **Access Ballot**: Voters securely log in to access active elections
3. **Cast Vote**: Votes are encrypted and stored on the blockchain
4. **Verification**: Each vote is verified and tallied securely
5. **View Results**: Results are published after the election closes

## Admin Features

- Create and manage elections
- Monitor voting progress
- Initialize and manage blockchain infrastructure
- View detailed election statistics
- Manage user access and roles

## Smart Contract Functions

The voting smart contract implements the following key functions:

- `InitLedger`: Initialize the ledger with sample data
- `CreateElection`: Create a new election with candidates
- `GetAllElections`: List all elections
- `CastVote`: Cast an encrypted vote
- `GetElectionResults`: Get the decrypted results of a closed election
- `VerifyBallot`: Verify the validity of a specific ballot

## Building for Production

### Backend
```bash
cd fabric-samples/asset-transfer-basic/application-gateway-javascript
npm run build
```

### Frontend
```bash
cd frontend
npm run build
```

## Deployment Recommendations

For production deployment, follow these additional steps:

1. Set up proper environment variables for production
2. Configure CORS settings in the backend to match your domain
3. Set up proper TLS certificates for secure communication
4. Configure SuperTokens for production use
5. Use a reverse proxy like Caddy or Nginx to handle HTTPS traffic
6. Set up proper monitoring and logging for the blockchain network

## Clean up

When you are finished, you can bring down the test network and clean up resources:

```bash
# Stop the SuperTokens container
docker stop supertokens
docker rm supertokens

# Bring down the Fabric network (from the test-network folder)
cd fabric-samples/test-network
./network.sh down
```

## License

This project is licensed under the [Business Source License 1.1](LICENSE.txt) (BUSL-1.1).

The BUSL is a non-open source license that automatically converts to an open source license (GNU General Public License v2.0 or later) after twenty years. The license allows:
- Free use for non-production environments
- Free use for evaluation, development, and testing
- Commercial use requires a separate license from the project maintainers

Change Date: May 18, 2045

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
