# Blockchain Voting Application with Fabric and SuperTokens

This application demonstrates:

- Secure user authentication with SuperTokens integration
- Connecting client applications to a Fabric blockchain network
- Secure voting operations using homomorphic encryption
- Managing election lifecycle on the blockchain
- Role-based access control for voters and administrators

## About the Application

This application provides a complete secure voting platform built on Hyperledger Fabric with SuperTokens authentication. It uses homomorphic encryption to ensure vote privacy while maintaining public verifiability.

For a more detailed walk-through of the Fabric Gateway API usage, refer to the [Running a Fabric Application tutorial](https://hyperledger-fabric.readthedocs.io/en/latest/write_first_app.html) in the main Hyperledger Fabric documentation.

### Application Architecture

The application consists of:

- **Backend API (Node.js)**: Integrates SuperTokens authentication with Fabric blockchain operations
- **Smart Contract (TypeScript)**: Manages elections, votes, and results on the blockchain

## System Architecture

The application implements a robust backend architecture:

1. **Hyperledger Fabric Network**
   - Channel: `mychannel`
   - Organizations: `Org1`, `Org2`
   - Smart Contract: TypeScript-based voting contract

2. **Node.js Backend**
   - Express.js REST API
   - Fabric Gateway SDK integration
   - SuperTokens authentication middleware
   - Homomorphic encryption services

3. **Authentication System**
   - SuperTokens Core service
   - Email/password authentication
   - Session management
   - Integration with Fabric CA for identity management

4. **Security Components**
   - JWT tokens for admin authentication
   - Fabric CA for certificate management
   - Zero-knowledge proofs for vote verification
   - Homomorphic encryption for vote privacy

Key features:

- **Authentication**: Email/password login with SuperTokens
- **Fabric Identity Management**: Maps SuperTokens users to Fabric identities
- **Encrypted Voting**: Homomorphic encryption for secure and private voting
- **Public Verification**: Ability to verify votes without compromising privacy
- **Admin Dashboard**: Election creation, management, and result declaration

## Technical Details

### Backend Technologies

- **Node.js**: Runtime environment for the backend
- **Express.js**: Web framework for building the API
- **SuperTokens**: Authentication and session management
- **Hyperledger Fabric SDK**: Gateway API for blockchain interaction
- **Homomorphic Encryption**: For secure, privacy-preserving voting
- **gRPC**: For communication with Fabric peers
- **JWT**: For admin authentication


### Smart Contract Functions

The voting smart contract implements the following key functions:

- `InitLedger`: Initialize the ledger with sample data
- `CreateElection`: Create a new election with candidates
- `GetAllElections`: List all elections
- `CastVote`: Cast an encrypted vote
- `GetElectionResults`: Get the decrypted results of a closed election
- `VerifyBallot`: Verify the validity of a specific ballot

The smart contract combines zero-knowledge proofs with homomorphic encryption to ensure that votes are valid while preserving voter privacy.

## Running the Application

Follow these steps to set up and run the application:

1. **Set up the Fabric network** (from the `test-network` folder):

   ```bash
   ./network.sh up createChannel -c mychannel -ca
   ```

2. **Deploy the TypeScript smart contract** (from the `test-network` folder):

   ```bash
   ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript/ -ccl typescript
   ```

3. **Configure environment variables** (create a `.env` file in the `application-gateway-javascript` folder):

   ```
   SUPERTOKENS_URI=http://localhost:3567
   API_DOMAIN=http://localhost:9010
   WEBSITE_DOMAIN=http://localhost:5173
   PORT=9010
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=adminpw
   ```

4. **Run the SuperTokens service** (using Docker):

   ```bash
   docker run -d \
     --name supertokens \
     -p 3567:3567 \
     -e DISABLE_TELEMETRY=true \
     registry.supertokens.io/supertokens/supertokens-node
   ```

5. **Start the backend application** (from the `application-gateway-javascript` folder):

   ```bash
   cd application-gateway-javascript
   npm install
   npm start
   ```

## Testing the API

After starting the backend, you can test the endpoints using cURL or a tool like Postman:

### Example requests

1. **Admin Login**:
   ```bash
   curl -X POST http://localhost:9010/fabric/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"adminpw"}'
   ```

2. **Initialize Ledger** (requires admin token):
   ```bash
   curl -X POST http://localhost:9010/initLedger \
     -H "Authorization: Bearer <admin-token>"
   ```

3. **Get All Elections**:
   ```bash
   curl -X GET http://localhost:9010/elections
   ```

## API Endpoints

The application exposes the following key endpoints:

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

## Deployment

For production deployment, follow these additional steps:

1. Set up proper environment variables for production
2. Configure CORS settings in `server.js` to match your backend domain
3. Set up proper TLS certificates for secure communication
4. Configure SuperTokens for production use
5. Use a reverse proxy like Caddy or Nginx to handle HTTPS traffic

## Clean up

When you are finished, you can bring down the test network and clean up resources:

```bash
# Stop the SuperTokens container
docker stop supertokens
docker rm supertokens

# Bring down the Fabric network (from the test-network folder)
./network.sh down
```

## License

This project is licensed under the [Business Source License 1.1](LICENSE.txt) (BUSL-1.1).

The BUSL is a non-open source license that automatically converts to an open source license (GNU General Public License v2.0 or later) after twenty years. The license allows:
- Free use for non-production environments
- Free use for evaluation, development, and testing
- Commercial use requires a separate license from the project maintainers

Change Date: May 18, 2045