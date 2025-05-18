const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault(
    'CRYPTO_PATH',
    path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com'
    )
);

// Path to admin private key directory.
const keyDirectoryPath = envOrDefault(
    'KEY_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'Admin@org1.example.com',
        'msp',
        'keystore'
    )
);

// Path to admin certificate directory.
const certDirectoryPath = envOrDefault(
    'CERT_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'Admin@org1.example.com',
        'msp',
        'signcerts'
    )
);

// Path to peer tls certificate.
const tlsCertPath = envOrDefault(
    'TLS_CERT_PATH',
    path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
);

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

/**
 * Manages Hyperledger Fabric network connections using the Gateway API.
 * 
 * @class Connection
 * @description Handles connection pooling, user authentication, and resource management
 * for interacting with Hyperledger Fabric networks. Maintains both an admin connection
 * and user-specific connections with credential-based authentication.
 * 
 * @property {Object} connectionPool - Pool of user connections indexed by userId
 * @property {number} maxPoolSize - Maximum number of concurrent connections to maintain
 * @property {Object} static contract - Shared contract instance for admin operations
 * @property {Object} adminGateway - Gateway instance for admin connection
 * @property {Object} adminClient - gRPC client for admin connection
 * 
 * Features:
 * - Connection pooling with automatic cleanup of idle and excess connections
 * - Support for both admin and user-specific credentials
 * - Automatic resource management (connection closing)
 * - Connection validation and expiration handling
 * - Connection statistics logging
 */
class Connection {
    constructor() {
        this.connectionPool = {};
        this.maxPoolSize = 10; 
    }

    static contract;

    async init() {
        // The gRPC client connection should be shared by all Gateway connections to this endpoint.
        const client = await this.newGrpcConnection();

        const gateway = connect({
            client,
            identity: await this.newIdentity(),
            signer: await this.newSigner(),
            hash: hash.sha256,
            // Default timeouts for different gRPC calls
            evaluateOptions: () => {
                return { deadline: Date.now() + 5000 }; // 5 seconds
            },
            endorseOptions: () => {
                return { deadline: Date.now() + 15000 }; // 15 seconds
            },
            submitOptions: () => {
                return { deadline: Date.now() + 5000 }; // 5 seconds
            },
            commitStatusOptions: () => {
                return { deadline: Date.now() + 60000 }; // 1 minute
            },
        });

        try {
            // Get a network instance representing the channel where the smart contract is deployed.
            const network = gateway.getNetwork(channelName);

            // Get the smart contract from the network.
            Connection.contract = network.getContract(chaincodeName);

            // Store references for cleanup
            this.adminGateway = gateway;
            this.adminClient = client;

            console.log('Connection initialized successfully with chaincode: ' + chaincodeName);
        } catch (error) {
            // Close resources on error
            try {
                gateway.close();
                client.close();
            } catch (closeError) {
                console.error('Error closing failed connection:', closeError);
            }
            console.log('Error initializing connection to the network:', error.message);
            throw error;
        }
    }

    async newGrpcConnection() {
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
        });
    }

    async newIdentity() {
        const certPath = await this.getFirstDirFileName(certDirectoryPath);
        const credentials = await fs.readFile(certPath);
        return { mspId, credentials };
    }

    async getFirstDirFileName(dirPath) {
        const files = await fs.readdir(dirPath);
        const file = files[0];
        if (!file) {
            throw new Error(`No files in directory: ${dirPath}`);
        }
        return path.join(dirPath, file);
    }

    async newSigner() {
        const keyPath = await this.getFirstDirFileName(keyDirectoryPath);
        const privateKeyPem = await fs.readFile(keyPath);
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        return signers.newPrivateKeySigner(privateKey);
    }

    /**
     * Get admin connection (default connection)
     */
    async getAdminConnection() {
        // The admin connection is initialized once in server.js
        // This method just returns the static contract reference.
        if (!Connection.contract) {
            throw new Error('Admin connection is not yet initialized. Ensure server startup is complete.');
        }
        return Connection.contract;
    }

    /**
     * Get a connection using user credentials
     */
    async getUserConnection(userId, credentials = null) {

        if (this.connectionPool[userId] && this.isConnectionValid(this.connectionPool[userId])) {
            return this.connectionPool[userId].contract;
        }

        let client = null;
        try {
            if (!credentials) {
                if (!global.userCredentials || !global.userCredentials[userId]) {
                    console.log(`No credentials found for user ${userId}`);
                    return null;
                }
                credentials = global.userCredentials[userId];
            }

            // Handle nested credentials structure
            let certData, privateKeyData, mspIdValue;

            if (credentials.credentials) {
                certData = credentials.credentials.certificate;
                privateKeyData = credentials.credentials.privateKey;
                mspIdValue = credentials.mspId || mspId;
            } else {
                certData = credentials.certificate;
                privateKeyData = credentials.privateKey;
                mspIdValue = mspId; // Use default
            }

            // Validate credentials format
            if (!certData || !privateKeyData) {
                console.error('Invalid credentials format - missing certificate or private key');
                return null;
            }

            // Create a new gRPC client connection
            client = await this.newGrpcConnection();

            try {
                // Create a signer from the user's private key
                const privateKey = crypto.createPrivateKey(privateKeyData);
                const userSigner = signers.newPrivateKeySigner(privateKey);

                // Connect to the gateway with user identity
                const gateway = connect({
                    client,
                    identity: {
                        mspId: mspIdValue,
                        credentials: Buffer.from(certData)
                    },
                    signer: userSigner,
                    hash: hash.sha256,
                    evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
                    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
                    submitOptions: () => ({ deadline: Date.now() + 5000 }),
                    commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
                });

                // Get the network and contract
                const network = gateway.getNetwork(channelName);
                const contract = network.getContract(chaincodeName);

                // Store in pool with timestamp
                this.connectionPool[userId] = {
                    contract: contract,
                    gateway: gateway,
                    client: client,
                    timestamp: Date.now()
                };

                // Clean old connections if pool is full
                this.cleanConnectionPool();

                return contract;
            } catch (cryptoError) {
                console.error(`Error processing crypto credentials for ${userId}:`, cryptoError);
                if (client) {
                    client.close();
                }
                return null;
            }
        } catch (error) {
            console.error(`Error creating user connection for ${userId}:`, error);
            if (client) {
                client.close();
            }
            return null;
        }
    }

    isConnectionValid(connection) {
        return connection && 
               connection.contract && 
               connection.gateway && 
               Date.now() - connection.timestamp < 3600000; // 1 hour max age
    }

    cleanConnectionPool() {
        // Remove oldest connections if pool exceeds max size
        const userIds = Object.keys(this.connectionPool);
        if (userIds.length > this.maxPoolSize) {
            const oldestUserId = userIds.sort((a, b) => 
                this.connectionPool[a].timestamp - this.connectionPool[b].timestamp)[0];
            this.closeConnection(oldestUserId);
        }
    }

    closeConnection(userId) {
        if (this.connectionPool[userId]) {
            try {
                // Close gateway
                if (this.connectionPool[userId].gateway) {
                    this.connectionPool[userId].gateway.close();
                }
                
                // Close client
                if (this.connectionPool[userId].client) {
                    this.connectionPool[userId].client.close();
                }
            } catch (error) {
                console.error(`Error closing connection for ${userId}:`, error);
            } finally {
                delete this.connectionPool[userId];
            }
        }
    }

    // Close all connections when server shuts down
    closeAllConnections() {

        Object.keys(this.connectionPool).forEach(userId => {
            this.closeConnection(userId);
        });
        
        // Close admin connection if it exists
        if (Connection.contract) {
            try {

                if (this.adminGateway) {
                    this.adminGateway.close();
                }
                if (this.adminClient) {
                    this.adminClient.close();
                }
            } catch (error) {
                console.error('Error closing admin connection:', error);
            }
        }
    }

    cleanupIdleConnections() {
        this.logConnectionStats();
        
        const now = Date.now();
        const maxIdleTime = 10 * 60 * 1000; // 10 minutes
        
        Object.keys(this.connectionPool).forEach(userId => {
            const connection = this.connectionPool[userId];
            if (now - connection.timestamp > maxIdleTime) {
                console.log(`Closing idle connection for user ${userId}`);
                this.closeConnection(userId);
            }
        });
    }

    logConnectionStats() {
        console.log(`==== Connection Pool Stats ====`);
        console.log(`Total connections: ${Object.keys(this.connectionPool).length}`);
        for (const [userId, conn] of Object.entries(this.connectionPool)) {
            const age = Math.round((Date.now() - conn.timestamp) / 1000);
            console.log(`- User ${userId}: ${age}s old`);
        }
    }
}

function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}

module.exports = { Connection };