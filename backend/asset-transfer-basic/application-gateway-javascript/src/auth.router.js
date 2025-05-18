const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const { buildCAClient, enrollAdmin } = require('../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../test-application/javascript/AppUtil.js');
const fs = require('fs').promises;

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const ORG = 'org1';
const ORG_MSP = 'Org1MSP';


const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpw';

class AuthRouter {
    constructor() {
        // Use the existing wallet path
        this.walletPath = path.join(__dirname, 'wallet');

        if (!fs.existsSync) {
            const fsSync = require('fs');
            if (!fsSync.existsSync(this.walletPath)) {
                fsSync.mkdirSync(this.walletPath, { recursive: true });
            }
        } else {
            // Create wallet directory if it doesn't exist
            fs.mkdir(this.walletPath, { recursive: true }).catch(err => {
                console.error('Error creating wallet directory:', err);
            });
        }

        this.initWallet().then(() => {
            this.initAdminEnrollment();
        }).catch(err => {
            console.error('Failed to initialize wallet:', err);
        });
    }

    /**
     * Initialize wallet instance
     */
    async initWallet() {
        try {
            // Build wallet once and store as instance property
            this.wallet = await buildWallet(Wallets, this.walletPath);
            console.log('Wallet initialized successfully');
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            throw error;
        }
    }

    /**
     * Initialize admin enrollment if not already enrolled
     */
    async initAdminEnrollment() {
        try {
            // Build connection profile and CA client
            const ccpOrg1 = buildCCPOrg1();
            const caClient = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

            if (!this.wallet) {
                this.wallet = await buildWallet(Wallets, this.walletPath);
            }

            // Check if admin is already enrolled
            const adminIdentity = await this.wallet.get('admin');
            if (!adminIdentity) {
                // If not already enrolled
                await enrollAdmin(caClient, this.wallet, ORG_MSP);
                console.log('Admin enrollment initialized successfully');
            } else {
                console.log('Admin already enrolled, skipping enrollment');
            }
        } catch (error) {
            console.error('Failed to initialize admin enrollment:', error);
        }
    }

    /**
     * Get the path to the admin tokens file
     * @returns {string} - Path to admin tokens file
     */
    getAdminTokensPath() {
        return path.join(this.walletPath, 'admin_tokens.json');
    }

    async recordFabricRegistration(userId) {
        const registryPath = path.join(this.walletPath, 'registered_users.json');
        let registry = {};

        try {
            try {
                const data = await fs.readFile(registryPath, 'utf8');
                registry = JSON.parse(data);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.warn('Error reading registration file:', err);
                }
            }

            registry[userId] = {
                registeredAt: new Date().toISOString()
            };

            await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
        } catch (error) {
            console.error('Error recording user registration:', error);
            throw error;
        }
    }

    async checkUserFabricRegistration(userId) {

        try {
            const registryPath = path.join(this.walletPath, 'registered_users.json');
            let registry = {};

            try {
                const data = await fs.readFile(registryPath, 'utf8');
                registry = JSON.parse(data);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error('Error reading registration file:', err);
                    return false;
                }
            }

            return !!registry[userId];
        } catch (error) {
            console.error('Error checking user registration:', error);
            return false;
        }
    }

    /**
     * Register and enroll user without storing in server wallet
     * @param {*} userId - User ID to register (from SuperTokens)
     * @returns {Promise<Object>} - User credentials
     */
    async registerWithFabricCA(userId) {
        try {

            const ccpOrg1 = buildCCPOrg1();
            const caClient = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

            if (!this.wallet) {
                this.wallet = await buildWallet(Wallets, this.walletPath);
            }

            // Must use an admin to register a new user
            const adminIdentity = await this.wallet.get('admin');
            if (!adminIdentity) {
                throw new Error('An identity for the admin user does not exist in the wallet');
            }

            const provider = this.wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            const secret = await caClient.register({
                affiliation: `${ORG}.department1`,
                enrollmentID: userId,
                role: 'client'
            }, adminUser);

            const enrollment = await caClient.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            // Identity object created but not stored in wallet
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: ORG_MSP,
                type: 'X.509',
            };

            console.log(`Successfully registered and enrolled user ${userId} with Fabric CA`);

            // Return the identity directly instead of storing it
            return x509Identity;
        } catch (error) {
            console.error(`Failed to register user with Fabric CA: ${error}`);
            throw error;
        }
    }


    /**
     * Save admin token to file
     * @param {string} token - The JWT token
     * @param {object} data - Token metadata
     */
    async saveAdminToken(token, data) {
        try {
            let tokens = {};
            const tokenPath = this.getAdminTokensPath();

            // Try to read existing tokens file
            try {
                const fileData = await fs.readFile(tokenPath, 'utf8');
                tokens = JSON.parse(fileData);
            } catch (err) {
                // File doesn't exist yet, that's ok
                if (err.code !== 'ENOENT') {
                    console.warn('Error reading admin tokens file:', err);
                }
            }
            // Add new token with data
            tokens[token] = {
                ...data,
                createdAt: new Date().toISOString()
            };

            // Clean up expired tokens
            Object.keys(tokens).forEach(key => {
                try {
                    jwt.verify(key, JWT_SECRET);
                } catch (err) {
                    // Token is invalid or expired, remove it
                    delete tokens[key];
                }
            });

            await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
        } catch (error) {
            console.error('Error saving admin token:', error);
        }
    }

    /**
     * Get admin token data from file
     * @param {string} token - The JWT token to find
     * @returns {object|null} - Token data or null if not found
     */
    async getAdminToken(token) {
        try {
            let tokens = {};
            const tokenPath = this.getAdminTokensPath();

            // Try to read existing tokens file
            try {
                const fileData = await fs.readFile(tokenPath, 'utf8');
                tokens = JSON.parse(fileData);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.warn('Error reading admin tokens file:', err);
                }
                return null;
            }

            // Return token data if it exists
            return tokens[token] || null;
        } catch (error) {
            console.error('Error getting admin token:', error);
            return null;
        }
    }

    /**
     * Middleware to verify admin JWT token
     */
    verifyAdminToken() {
        return async (req, res, next) => {
            try {
                // Get token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).send({ error: 'Admin authentication required' });
                }

                const token = authHeader.split(' ')[1];

                // Verify the token
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);

                    // Check if token exists in our storage
                    const tokenData = await this.getAdminToken(token);
                    if (!tokenData) {
                        return res.status(401).send({ error: 'Invalid admin token' });
                    }

                    // Add admin data to request
                    req.admin = {
                        username: decoded.username,
                        iat: decoded.iat,
                        exp: decoded.exp
                    };

                    next();
                } catch (err) {
                    return res.status(401).send({ error: 'Invalid or expired admin token' });
                }
            } catch (error) {
                console.error('Error in admin token verification:', error);
                return res.status(500).send({ error: 'Internal server error during authentication' });
            }
        };
    }

    routes(app, verifySession) {
        // Register with SuperTokens and Fabric CA
        app.post('/fabric/register', verifySession(), async (req, res) => {
            try {
                const userId = req.session.getUserId();

                // Register user with Fabric CA using SuperTokens userId
                const fabricIdentity = await this.registerWithFabricCA(userId);

                if (!fabricIdentity) {
                    throw new Error('Failed to get enrolled identity');
                }

                // Create ID file format for Fabric
                const idFile = {
                    credentials: {
                        certificate: fabricIdentity.credentials.certificate,
                        privateKey: fabricIdentity.credentials.privateKey.toString()
                    },
                    mspId: ORG_MSP,
                    type: "X.509",
                    version: 1
                };

                await this.recordFabricRegistration(userId);

                // Return the credentials to the user in the same format as admin.id
                res.status(200).send({
                    message: 'Fabric identity created successfully',
                    userId: userId,
                    identityFile: idFile,
                    filename: `${userId}.id`
                });
            } catch (error) {
                console.error('Error creating Fabric identity:', error);
                res.status(500).send({
                    error: 'Failed to create Fabric identity',
                    details: error.message
                });
            }
        });

        // Admin - check status
        app.get('/fabric/admin/status', async (req, res) => {
            try {
                if (!this.wallet) {
                    this.wallet = await buildWallet(Wallets, this.walletPath);
                }
                const adminIdentity = await this.wallet.get('admin');

                if (adminIdentity) {
                    res.status(200).send({
                        status: 'enrolled',
                        message: 'Admin is enrolled with Fabric CA'
                    });
                } else {
                    res.status(200).send({
                        status: 'not_enrolled',
                        message: 'Admin is not enrolled with Fabric CA'
                    });
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                res.status(500).send({ error: 'Failed to check admin status' });
            }
        });

        // Force admin enrollment with Fabric CA
        app.post('/fabric/admin/enroll', this.verifyAdminToken(), async (req, res) => {
            try {

                const ccpOrg1 = buildCCPOrg1();
                const caClient = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

                if (!this.wallet) {
                    this.wallet = await buildWallet(Wallets, this.walletPath);
                }

                // Enroll admin
                await enrollAdmin(caClient, this.wallet, ORG_MSP);

                res.status(200).send({ message: 'Admin enrolled successfully with Fabric CA' });
            } catch (error) {
                console.error('Error enrolling admin:', error);
                res.status(500).send({ error: 'Failed to enroll admin with Fabric CA', details: error.message });
            }
        });

        // Admin Login endpoint
        app.post('/fabric/admin/login', async (req, res) => {
            try {
                const { username, password } = req.body;

                if (!username || !password) {
                    return res.status(400).send({
                        error: 'Username and password are required'
                    });
                }

                // Validate admin credentials
                if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                    // Generate JWT token
                    const token = jwt.sign(
                        { username, role: 'admin' },
                        JWT_SECRET,
                        { expiresIn: JWT_EXPIRY }
                    );

                    // Save token to file
                    await this.saveAdminToken(token, { username });

                    // Return token to client
                    return res.status(200).send({
                        success: true,
                        message: 'Admin login successful',
                        token,
                        expiresIn: JWT_EXPIRY
                    });
                } else {
                    return res.status(401).send({
                        success: false,
                        error: 'Invalid admin credentials'
                    });
                }
            } catch (error) {
                console.error('Error during admin login:', error);
                res.status(500).send({
                    error: 'Failed to process admin login',
                    details: error.message
                });
            }
        });

        // Check if user has a registered Fabric identity
        app.get('/fabric/identity/check', verifySession(), async (req, res) => {
            try {
                const userId = req.session.getUserId();

                const isRegistered = await this.checkUserFabricRegistration(userId);

                res.status(200).send({
                    registered: isRegistered,
                    message: isRegistered ?
                        'User has previously registered with Fabric CA' :
                        'User needs to register with Fabric CA'
                });
            } catch (error) {
                console.error('Error checking Fabric registration:', error);
                res.status(500).send({ error: 'Failed to check Fabric registration' });
            }
        });
    }
}

exports.AuthRouter = AuthRouter;