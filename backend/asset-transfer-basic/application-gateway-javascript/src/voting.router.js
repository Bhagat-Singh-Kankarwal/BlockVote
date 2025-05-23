const { Connection } = require('./connection');
const { TextDecoder } = require('node:util');

const fs = require('fs').promises;
const path = require('path');

// Read the key file
const keyFilePath = path.join(__dirname, '../demo.key');

// Import FHE library
const {
    Voter,
    deserializePublicKey,
    generateKeyPair,
    serializePublicKey,
    serializePrivateKey
} = require('mind-paillier-voting-sdk');

const utf8Decoder = new TextDecoder();

class VotingRouter {
    constructor() {
        // Create a Connection instance to use its methods
        this.connection = new Connection();
    }

    // Check and update expired elections
    async checkAndEndExpiredElections() {
        try {
            console.log('Checking for expired elections...');
            // Get admin connection
            const contract = await this.connection.getAdminConnection();

            // Get all elections
            const resultBytes = await contract.evaluateTransaction('GetAllElections');
            const resultJson = utf8Decoder.decode(resultBytes);
            const elections = JSON.parse(resultJson);

            const currentTime = Date.now();

            let endedCount = 0;
            for (const election of elections) {
                if (election.status === 'ACTIVE' && election.endDate < currentTime) {
                    console.log(`Automatically ending election ${election.electionID} as end date has passed`);

                    await contract.submitTransaction(
                        'UpdateElectionStatus',
                        election.electionID,
                        'ENDED'
                    );
                    endedCount++;
                }
            }

            if (endedCount > 0) {
                console.log(`Automatically ended ${endedCount} expired elections`);
            }
        } catch (error) {
            console.error('Error checking for expired elections:', error);
        }
    }

    // Start periodic election monitor
    startElectionMonitor(intervalMs = 60000) { // Default check every minute
        this.electionMonitorInterval = setInterval(() => {
            this.checkAndEndExpiredElections();
        }, intervalMs);

        console.log(`Started election monitor (checking every ${intervalMs / 1000} seconds)`);

        // Run an immediate check when starting
        this.checkAndEndExpiredElections();
    }

    // Stop the election monitor (for clean shutdown)
    stopElectionMonitor() {
        if (this.electionMonitorInterval) {
            clearInterval(this.electionMonitorInterval);
            this.electionMonitorInterval = null;
            console.log('Stopped election monitor');
        }
    }

    routes(app, verifySession, verifyAdminToken) {

        // =====================================================================
        // GLOBAL ROUTES (NO AUTHENTICATION REQUIRED)
        // =====================================================================

        // Get all elections
        app.route('/elections')
            .get(async (req, res) => {
                try {
                    // Use admin connection for public read operations
                    const contract = await this.connection.getAdminConnection();
                    const resultBytes = await contract.evaluateTransaction('GetAllElections');
                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);
                    res.status(200).send(result);
                } catch (error) {
                    console.error('Error getting all elections:', error);
                    res.status(500).send({ error: 'Failed to get elections' });
                }
            });

        // Get active elections
        app.route('/elections/active')
            .get(async (req, res) => {
                try {
                    const contract = await this.connection.getAdminConnection();
                    const resultBytes = await contract.evaluateTransaction('GetActiveElections');
                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);
                    res.status(200).send(result);
                } catch (error) {
                    console.error('Error getting active elections:', error);
                    res.status(500).send({ error: 'Failed to get active elections' });
                }
            });

        // Check if an election exists
        app.route('/elections/exists/:electionID')
            .get(async (req, res) => {
                try {
                    const contract = await this.connection.getAdminConnection();
                    const resultBytes = await contract.evaluateTransaction(
                        'ElectionExists',
                        req.params.electionID
                    );
                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);
                    res.status(200).send({ exists: result });
                } catch (error) {
                    console.error('Error checking if election exists:', error);
                    res.status(500).send({ error: 'Failed to check election existence' });
                }
            });

        // Get a specific election
        app.route('/elections/:electionID')
            .get(async (req, res) => {
                try {
                    const contract = await this.connection.getAdminConnection();
                    const resultBytes = await contract.evaluateTransaction(
                        'GetElection',
                        req.params.electionID
                    );
                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);
                    res.status(200).send(result);
                } catch (error) {
                    console.error(`Error getting election ${req.params.electionID}:`, error);
                    res.status(500).send({ error: 'Failed to get election', details: error.message });
                }
            });

        // Get public election results (only for RESULTS_DECLARED elections)
        app.route('/elections/:electionID/public-results')
            .get(async (req, res) => {
                try {
                    // First check if the election status is RESULTS_DECLARED
                    const contract = await this.connection.getAdminConnection();

                    // Get the election to check status
                    const electionBytes = await contract.evaluateTransaction(
                        'GetElection',
                        req.params.electionID
                    );

                    const electionJson = utf8Decoder.decode(electionBytes);
                    const election = JSON.parse(electionJson);

                    // Only allow access if results are officially declared
                    if (election.status !== 'RESULTS_DECLARED' && election.status !== 'ENDED') {
                        return res.status(403).send({
                            error: 'Results not available',
                            details: 'Results for this election have not been officially declared yet'
                        });
                    }

                    const keyData = await fs.readFile(keyFilePath, 'utf8');
                    const keys = JSON.parse(keyData);
                    const serializedPrivateKey = keys.privateKey;

                    // If status is RESULTS_DECLARED, get results with private key
                    const resultBytes = await contract.evaluateTransaction(
                        'GetElectionResults',
                        req.params.electionID,
                        serializedPrivateKey
                    );

                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);

                    res.status(200).send(result);
                } catch (error) {
                    console.error('Error getting public election results:', error);
                    res.status(500).send({
                        error: 'Failed to get election results',
                        details: error.message
                    });
                }
            });


        // =====================================================================
        // USER ROUTES (REQUIRE AUTHENTICATION)
        // =====================================================================

        // Register a voter for an election
        app.route('/elections/:electionID/register')
            .post(verifySession(), async (req, res) => {
                const voterID = req.session.getUserId();
                try {
                    // Get user credentials from request body
                    const { credentials } = req.body;

                    if (!credentials) {
                        return res.status(400).send({
                            error: 'Missing user credentials',
                            details: 'Please provide your Fabric identity credentials'
                        });
                    }

                    // Get user's Fabric connection with credentials
                    const contract = await this.connection.getUserConnection(voterID, credentials);
                    if (!contract) {
                        return res.status(400).send({
                            error: 'Failed to create Fabric connection',
                            details: 'Could not establish connection with provided credentials'
                        });
                    }

                    // Submit transaction to register voter
                    await contract.submitTransaction(
                        'RegisterVoter',
                        req.params.electionID,
                        voterID
                    );

                    res.status(200).send({
                        success: true,
                        message: 'Voter registered successfully for election'
                    });
                } catch (error) {
                    console.error(`Error registering voter for election ${req.params.electionID}:`, error);
                    res.status(500).send({
                        error: 'Failed to register voter',
                        details: error.message
                    });
                } finally {
                    // Mark connection as recently used for potential reuse
                    if (voterID && this.connection.connectionPool &&
                        this.connection.connectionPool[voterID]) {
                        this.connection.connectionPool[voterID].timestamp = Date.now();
                    }
                }
            });

        // Cast a vote in an election
        app.route('/elections/:electionID/vote')
            .post(verifySession(), async (req, res) => {
                const voterID = req.session.getUserId();
                try {
                    const { candidateIndex, credentials } = req.body;

                    if (candidateIndex === undefined) {
                        return res.status(400).send({ error: 'candidateIndex is required' });
                    }

                    if (!credentials) {
                        return res.status(400).send({
                            error: 'Missing user credentials',
                            details: 'Please provide your Fabric identity credentials'
                        });
                    }

                    // Get user's Fabric connection
                    const contract = await this.connection.getUserConnection(voterID, credentials);

                    // First, get election to know number of candidates
                    const electionBytes = await contract.evaluateTransaction(
                        'GetElection',
                        req.params.electionID
                    );
                    const electionJson = utf8Decoder.decode(electionBytes);
                    const election = JSON.parse(electionJson);

                    // Get public key
                    const publicKeyBytes = await contract.evaluateTransaction('GetPublicKey');
                    const serializedPublicKey = utf8Decoder.decode(publicKeyBytes);
                    const publicKey = deserializePublicKey(serializedPublicKey);

                    // Use the Voter class to encrypt each bit
                    const voter = new Voter(1, publicKey);

                    // Create arrays for encrypted ballot and proofs
                    const allProofs = [];
                    const encryptedBallot = [];

                    // For each candidate position, encrypt 1 if selected, 0 if not
                    for (let i = 0; i < election.candidates.length; i++) {
                        const bitValue = i === parseInt(candidateIndex) ? 1 : 0;
                        const proofs = voter.encryptNumber(bitValue);

                        // Store the encrypted value
                        encryptedBallot.push(proofs[0].c.toString());

                        // Store proofs
                        allProofs.push(proofs);
                    }

                    // Convert proofs to a string for storage
                    const proofsJson = JSON.stringify(allProofs, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value
                    );

                    // Submit transaction to cast vote with encrypted ballot
                    await contract.submitTransaction(
                        'CastVote',
                        req.params.electionID,
                        voterID,
                        JSON.stringify(encryptedBallot),
                        proofsJson
                    );

                    res.status(200).send({
                        success: true,
                        message: 'Vote cast successfully',
                    });
                } catch (error) {
                    console.error(`Error casting vote for election ${req.params.electionID}:`, error);

                    // Handle specific error cases
                    if (error.message.includes('already cast a vote')) {
                        return res.status(400).send({
                            error: 'Already voted',
                            details: 'You have already cast a vote in this election'
                        });
                    } else if (error.message.includes('not registered')) {
                        return res.status(400).send({
                            error: 'Not registered',
                            details: 'You are not registered for this election'
                        });
                    } else if (error.message.includes('not active')) {
                        return res.status(400).send({
                            error: 'Election not active',
                            details: 'This election is not currently active'
                        });
                    }

                    res.status(500).send({
                        error: 'Failed to cast vote',
                        details: error.message
                    });
                } finally {
                    // Mark connection as recently used for potential reuse
                    if (voterID && this.connection.connectionPool &&
                        this.connection.connectionPool[voterID]) {
                        this.connection.connectionPool[voterID].timestamp = Date.now();
                    }
                }
            });

        // Check if user has voted in an election (get user's vote)
        app.route('/elections/:electionID/voted')
            .post(verifySession(), async (req, res) => {
                const voterID = req.session.getUserId();
                try {
                    // Get user credentials from query params or request body
                    const { credentials } = req.body;

                    if (!credentials) {
                        return res.status(400).send({
                            error: 'Missing user credentials',
                            details: 'Please provide your Fabric identity credentials'
                        });
                    }

                    // Get user's Fabric connection with credentials
                    const contract = await this.connection.getUserConnection(voterID, credentials);
                    if (!contract) {
                        return res.status(400).send({
                            error: 'Failed to create Fabric connection',
                            details: 'Could not establish connection with provided credentials'
                        });
                    }

                    try {
                        // Try to get vote information
                        const resultBytes = await contract.evaluateTransaction(
                            'GetVote',
                            req.params.electionID,
                            voterID
                        );

                        const resultJson = utf8Decoder.decode(resultBytes);
                        const result = JSON.parse(resultJson);

                        res.status(200).send({
                            hasVoted: true,
                            vote: result,
                            transactionID: result.transactionID || 'Transaction ID not available'
                        });
                    } catch (error) {
                        // If error contains "No vote found", user has not voted
                        if (error.message.includes('No vote found')) {
                            res.status(200).send({
                                hasVoted: false
                            });
                        } else {
                            throw error; // Re-throw other errors
                        }
                    }
                } catch (error) {
                    console.error(`Error checking vote status for election ${req.params.electionID}:`, error);
                    res.status(500).send({
                        error: 'Failed to check vote status',
                        details: error.message
                    });
                } finally {
                    // Mark connection as recently used for potential reuse
                    if (voterID && this.connection.connectionPool &&
                        this.connection.connectionPool[voterID]) {
                        this.connection.connectionPool[voterID].timestamp = Date.now();
                    }
                }
            });

        // Get voter's elections (elections where voter is registered)
        app.route('/user/elections')
            .post(verifySession(), async (req, res) => {
                const voterID = req.session.getUserId();
                try {
                    // Get user credentials from query params
                    const { credentials } = req.body;

                    if (!credentials) {
                        return res.status(400).send({
                            error: 'Missing user credentials',
                            details: 'Please provide your Fabric identity credentials'
                        });
                    }

                    // Get user's Fabric connection with credentials
                    const contract = await this.connection.getUserConnection(voterID, credentials);
                    if (!contract) {
                        return res.status(400).send({
                            error: 'Failed to create Fabric connection',
                            details: 'Could not establish connection with provided credentials'
                        });
                    }

                    const resultBytes = await contract.evaluateTransaction(
                        'GetVoterElections',
                        voterID
                    );

                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);

                    res.status(200).send(result);
                } catch (error) {
                    console.error('Error getting voter elections:', error);
                    res.status(500).send({
                        error: 'Failed to get voter elections',
                        details: error.message
                    });
                } finally {
                    // Mark connection as recently used for potential reuse
                    if (voterID && this.connection.connectionPool &&
                        this.connection.connectionPool[voterID]) {
                        this.connection.connectionPool[voterID].timestamp = Date.now();
                    }
                }
            });

        app.route('/elections/:electionID/verify-my-ballot')
            .post(verifySession(), async (req, res) => {
                const voterID = req.session.getUserId();
                try {
                    const { credentials } = req.body;

                    if (!credentials) {
                        return res.status(400).send({
                            error: 'Missing user credentials',
                            details: 'Please provide your Fabric identity credentials'
                        });
                    }

                    const contract = await this.connection.getUserConnection(voterID, credentials);
                    if (!contract) {
                        return res.status(400).send({
                            error: 'Failed to create Fabric connection',
                            details: 'Could not establish connection with provided credentials'
                        });
                    }

                    const resultBytes = await contract.evaluateTransaction(
                        'VerifyBallot',
                        req.params.electionID,
                        voterID
                    );

                    const result = JSON.parse(utf8Decoder.decode(resultBytes));
                    res.status(200).send({
                        isValid: result,
                        message: result ? 'Your ballot verification passed' : 'Ballot verification failed'
                    });
                } catch (error) {
                    console.error('Error verifying user ballot:', error);
                    res.status(500).send({
                        error: 'Verification failed',
                        details: error.message
                    });
                } finally {
                    if (voterID && this.connection.connectionPool &&
                        this.connection.connectionPool[voterID]) {
                        this.connection.connectionPool[voterID].timestamp = Date.now();
                    }
                }
            });

        // =====================================================================
        // ADMIN ROUTES (REQUIRE ADMIN AUTHENTICATION)
        // =====================================================================

        // Initialize the ledger (admin only)
        app.route('/initLedger')
            .post(verifyAdminToken(), async (req, res) => {
                try {
                    const contract = await this.connection.getAdminConnection();
                    await contract.submitTransaction('InitLedger');

                    res.status(200).send({
                        success: true,
                        message: 'Ledger initialized successfully',
                    });
                } catch (error) {
                    console.error('Error initializing ledger:', error);
                    res.status(500).send({
                        error: 'Failed to initialize ledger',
                        details: error.message
                    });
                }
            });

        // Create a new election (admin only)
        app.route('/admin/elections')
            .post(verifyAdminToken(), async (req, res) => {
                try {
                    const {
                        electionID,
                        name,
                        description,
                        startDate,
                        endDate,
                        candidates
                    } = req.body;

                    if (!electionID || !name || !startDate || !endDate || !candidates) {
                        return res.status(400).send({
                            error: 'Missing required election parameters'
                        });
                    }

                    // Use admin connection for election creation
                    const contract = await this.connection.getAdminConnection();

                    await contract.submitTransaction(
                        'CreateElection',
                        electionID,
                        name,
                        description || '',
                        startDate.toString(),
                        endDate.toString(),
                        JSON.stringify(candidates)
                    );

                    res.status(201).send({
                        success: true,
                        message: 'Election created successfully',
                        electionID
                    });
                } catch (error) {
                    console.error('Error creating election:', error);
                    res.status(500).send({
                        error: 'Failed to create election',
                        details: error.message
                    });
                }
            });

        // Update election status (admin only)
        app.route('/admin/elections/:electionID/status')
            .put(verifyAdminToken(), async (req, res) => {
                try {
                    const { newStatus } = req.body;

                    if (!newStatus) {
                        return res.status(400).send({ error: 'newStatus is required' });
                    }

                    const status = newStatus.toString().toUpperCase();

                    // Use admin connection
                    const contract = await this.connection.getAdminConnection();

                    // First, get the current election to check its status
                    const electionBytes = await contract.evaluateTransaction(
                        'GetElection',
                        req.params.electionID
                    );

                    const electionJson = utf8Decoder.decode(electionBytes);
                    const election = JSON.parse(electionJson);

                    // Prevent changing status if election is already ENDED
                    if (election.status === 'ENDED' && status !== 'ENDED') {
                        return res.status(400).send({
                            error: 'Invalid status transition',
                            details: 'Elections with ENDED status cannot be changed to another status'
                        });
                    }

                    await contract.submitTransaction(
                        'UpdateElectionStatus',
                        req.params.electionID,
                        status
                    );

                    res.status(200).send({
                        success: true,
                        message: 'Election status updated successfully',
                        electionID: req.params.electionID,
                        status
                    });
                } catch (error) {
                    console.error(`Error updating election ${req.params.electionID} status:`, error);
                    res.status(500).send({
                        error: 'Failed to update election status',
                        details: error.message
                    });
                }
            });

        // Get election results (admin only)
        app.route('/admin/elections/:electionID/results')
            .get(verifyAdminToken(), async (req, res) => {
                try {
                    const contract = await this.connection.getAdminConnection();

                    const keyData = await fs.readFile(keyFilePath, 'utf8');
                    const keys = JSON.parse(keyData);
                    const serializedPrivateKey = keys.privateKey;

                    const resultBytes = await contract.evaluateTransaction(
                        'GetElectionResults',
                        req.params.electionID,
                        serializedPrivateKey
                    );

                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);

                    res.status(200).send(result);
                } catch (error) {
                    console.error('Error getting election results:', error);
                    res.status(500).send({
                        error: 'Failed to get election results',
                        details: error.message
                    });
                }
            });

        // Get vote count (admin only)
        app.route('/admin/elections/:electionID/count')
            .get(verifyAdminToken(), async (req, res) => {
                try {
                    // Use admin connection
                    const contract = await this.connection.getAdminConnection();

                    const resultBytes = await contract.evaluateTransaction(
                        'GetVoteCount',
                        req.params.electionID
                    );

                    const resultJson = utf8Decoder.decode(resultBytes);
                    const result = JSON.parse(resultJson);

                    res.status(200).send(result);
                } catch (error) {
                    console.error(`Error getting vote count for election ${req.params.electionID}:`, error);
                    res.status(500).send({
                        error: 'Failed to get vote count',
                        details: error.message
                    });
                }
            });

        // Delete an election (admin only)
        app.route('/admin/elections/:electionID')
            .delete(verifyAdminToken(), async (req, res) => {
                try {
                    // Use admin connection
                    const contract = await this.connection.getAdminConnection();

                    await contract.submitTransaction(
                        'DeleteElection',
                        req.params.electionID
                    );

                    res.status(200).send({
                        success: true,
                        message: 'Election deleted successfully',
                        electionID: req.params.electionID
                    });
                } catch (error) {
                    console.error(`Error deleting election ${req.params.electionID}:`, error);
                    res.status(500).send({
                        error: 'Failed to delete election',
                        details: error.message
                    });
                }
            });

        app.route('/admin/initialize-encryption')
            .post(verifyAdminToken(), async (req, res) => {
                try {

                    const keyData = await fs.readFile(keyFilePath, 'utf8');
                    const keys = JSON.parse(keyData);

                    // Extract serialized keys
                    const serializedPublicKey = keys.publicKey;

                    console.log('Using pre-generated public key from demo.key');


                    // Get admin connection
                    const contract = await this.connection.getAdminConnection();

                    // Pass the pre-generated keys to the chaincode and get the response
                    const resultBytes = await contract.submitTransaction(
                        'InitializeEncryption',
                        serializedPublicKey,
                    );

                    // Decode and check the response
                    const resultStr = utf8Decoder.decode(resultBytes);

                    if (resultStr.includes('already initialized')) {
                        return res.status(409).send({
                            error: 'Encryption already initialized',
                            details: 'Encryption keys already exist in the ledger. For security reasons, keys cannot be overwritten.'
                        });
                    }

                    res.status(200).send({
                        success: true,
                        message: 'Encryption system initialized successfully',
                    });
                } catch (error) {
                    console.error('Error initializing encryption system:', error);
                    res.status(500).send({
                        error: 'Failed to initialize encryption system',
                        details: error.message
                    });
                }
            });

        // Add endpoint to verify a ballot
        app.route('/elections/:electionID/verify-ballot/:voterID')
            .get(verifyAdminToken(), async (req, res) => {
                try {
                    const contract = await this.connection.getAdminConnection();
                    const isValidBytes = await contract.evaluateTransaction(
                        'VerifyBallot',
                        req.params.electionID,
                        req.params.voterID
                    );

                    const isValid = JSON.parse(utf8Decoder.decode(isValidBytes));

                    res.status(200).send({
                        isValid,
                        message: isValid ? 'Ballot verification successful' : 'Ballot verification failed'
                    });
                } catch (error) {
                    console.error('Error verifying ballot:', error);
                    res.status(500).send({
                        error: 'Failed to verify ballot',
                        details: error.message
                    });
                }
            });
    }
}

module.exports = { VotingRouter };