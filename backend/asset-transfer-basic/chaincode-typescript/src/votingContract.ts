import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import {
    deserializePublicKey,
    deserializePrivateKey,
    Verifier,
    Proof,
} from 'mind-paillier-voting-sdk';


export class Candidate {
    public candidateID: string;
    public name: string;
    public party: string;

    constructor(candidateID: string, name: string, party: string) {
        this.candidateID = candidateID;
        this.name = name;
        this.party = party;
    }
}

export enum ElectionStatus {
    CREATED = 'CREATED',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    ENDED = 'ENDED',
    RESULTS_DECLARED = 'RESULTS_DECLARED',
    CANCELED = 'CANCELED'
}

export class Election {
    public docType?: string;
    public electionID: string;
    public name: string;
    public description: string;
    public startDate: number;
    public endDate: number;
    public candidates: Candidate[];
    public status: ElectionStatus;
    public registeredVoters: string[];
    public results?: any[];

    constructor(electionID: string, name: string, description: string, startDate: number, endDate: number, candidates: Candidate[]) {
        this.docType = 'election';
        this.electionID = electionID;
        this.name = name;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.candidates = candidates;
        this.status = ElectionStatus.CREATED;
        this.registeredVoters = [];
    }
}

// Vote class
export class PrivateVote {
    public docType?: string;
    public voterID: string;
    public electionID: string;
    public timestamp: number;
    public encryptedBallot: string[]; // One encrypted value per candidate
    public proofs: string; // JSON string of proofs array
    public transactionID: string;

    constructor(voterID: string, electionID: string, encryptedBallot: string[], proofs: string, transactionID?: string) {
        this.docType = 'vote';
        this.voterID = voterID;
        this.electionID = electionID;
        this.encryptedBallot = encryptedBallot;
        this.proofs = proofs;
        this.timestamp = 0;
        this.transactionID = transactionID || '';
    }
}

// Add key storage class
export class EncryptionKeys {
    public docType: string;
    public publicKey: string;
    public privateKey: string;

    constructor(publicKey: string, privateKey: string) {
        this.docType = 'encryptionkeys';
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}

@Info({ title: 'VotingContract', description: 'Smart contract for secure e-voting system' })
export class VotingContract extends Contract {

    // Helper method to get deterministic timestamp
    private getTransactionTimestamp(ctx: Context): number {
        const timestamp = ctx.stub.getTxTimestamp();
        return (timestamp.seconds.low * 1000) + Math.floor(timestamp.nanos / 1000000);
    }

    // Helper method to prefix election IDs
    private getElectionKey(electionID: string): string {
        return `ELECTION_${electionID}`;
    }

    // Initialize the ledger with a sample election
    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const currentTime = this.getTransactionTimestamp(ctx);
        const candidates = [
            new Candidate('c1', 'Candidate 1', 'Party A'),
            new Candidate('c2', 'Candidate 2', 'Party B'),
        ];

        const election = new Election(
            'election1',
            'General Election 2025',
            'National general election for 2025',
            currentTime,
            currentTime + 21600000, // 6 hours from now
            candidates
        );

        await ctx.stub.putState(this.getElectionKey(election.electionID), Buffer.from(stringify(election)));
    }

    // Create a new election
    @Transaction()
    public async CreateElection(
        ctx: Context,
        electionID: string,
        name: string,
        description: string,
        startDate: string,
        endDate: string,
        candidatesJSON: string
    ): Promise<void> {
        // Check if election already exists
        const exists = await this.ElectionExists(ctx, electionID);
        if (exists) {
            throw new Error(`Election ${electionID} already exists`);
        }

        const startTimestamp = parseInt(startDate);
        const endTimestamp = parseInt(endDate);
        const candidates = JSON.parse(candidatesJSON) as Candidate[];

        const election = new Election(
            electionID,
            name,
            description,
            startTimestamp,
            endTimestamp,
            candidates
        );

        await ctx.stub.putState(this.getElectionKey(electionID), Buffer.from(stringify(election)));
    }

    // Check if an election exists
    @Transaction(false)
    @Returns('boolean')
    public async ElectionExists(ctx: Context, electionID: string): Promise<boolean> {
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        return electionJSON && electionJSON.length > 0;
    }

    // Get an election by ID
    @Transaction(false)
    @Returns('string')
    public async GetElection(ctx: Context, electionID: string): Promise<string> {
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        if (!electionJSON || electionJSON.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }
        return electionJSON.toString();
    }

    // Register a voter for an election
    @Transaction()
    public async RegisterVoter(ctx: Context, electionID: string, voterID: string): Promise<void> {
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        if (!electionJSON || electionJSON.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }

        const election = JSON.parse(electionJSON.toString()) as Election;

        // Check if voter is already registered
        if (election.registeredVoters.includes(voterID)) {
            throw new Error(`Voter ${voterID} is already registered for election ${electionID}`);
        }

        // Register the voter
        election.registeredVoters.push(voterID);
        await ctx.stub.putState(electionKey, Buffer.from(stringify(election)));
    }

    @Transaction()
    public async InitializeEncryption(ctx: Context, publicKeyStr: string, privateKeyStr: string): Promise<string> {
        // Check if keys already exist
        const keysJSON = await ctx.stub.getState('ENCRYPTION_KEYS');
        if (keysJSON && keysJSON.length > 0) {
            return 'Encryption already initialized';
        }

        // Store the pre-generated keys directly - no key generation in chaincode
        const keys = new EncryptionKeys(publicKeyStr, privateKeyStr);
        await ctx.stub.putState('ENCRYPTION_KEYS', Buffer.from(stringify(keys)));

        return 'Encryption system initialized successfully with pre-generated keys';
    }

    // Add method to get public key
    @Transaction(false)
    @Returns('string')
    public async GetPublicKey(ctx: Context): Promise<string> {
        const keysJSON = await ctx.stub.getState('ENCRYPTION_KEYS');
        if (!keysJSON || keysJSON.length === 0) {
            throw new Error('Encryption system not initialized');
        }

        const keys = JSON.parse(keysJSON.toString()) as EncryptionKeys;
        return keys.publicKey;
    }

    // Update CastVote to handle encrypted votes
    @Transaction()
    public async CastVote(ctx: Context, electionID: string, voterID: string,
        encryptedBallotJSON: string, proofsJSON: string): Promise<void> {
        // Check if voter has already voted
        const voteKey = `VOTE_${electionID}_${voterID}`;
        const existingVoteJSON = await ctx.stub.getState(voteKey);
        if (existingVoteJSON && existingVoteJSON.length > 0) {
            throw new Error(`Voter ${voterID} has already cast a vote in election ${electionID}`);
        }

        // Verify the election exists and is active
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        if (!electionJSON || electionJSON.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }

        const election = JSON.parse(electionJSON.toString()) as Election;

        // Check if election is active
        if (election.status !== ElectionStatus.ACTIVE) {
            throw new Error(`Election ${electionID} is not active`);
        }

        // Check if voter is registered
        if (!election.registeredVoters.includes(voterID)) {
            throw new Error(`Voter ${voterID} is not registered for election ${electionID}`);
        }

        // Parse the encrypted ballot and proofs
        const encryptedBallot = JSON.parse(encryptedBallotJSON) as string[];

        // Verify ballot has correct number of entries
        if (encryptedBallot.length !== election.candidates.length) {
            throw new Error(`Invalid ballot: expected ${election.candidates.length} values, got ${encryptedBallot.length}`);
        }

        // Create and store the vote
        const vote = new PrivateVote(
            voterID,
            electionID,
            encryptedBallot,
            proofsJSON,
            ctx.stub.getTxID()
        );
        vote.timestamp = this.getTransactionTimestamp(ctx);

        await ctx.stub.putState(voteKey, Buffer.from(stringify(vote)));
    }

    // Add method to verify ballot
    @Transaction(false)
    @Returns('boolean')
    public async VerifyBallot(ctx: Context, electionID: string, voterID: string): Promise<boolean> {
        const voteKey = `VOTE_${electionID}_${voterID}`;
        const voteJSON = await ctx.stub.getState(voteKey);
        if (!voteJSON || voteJSON.length === 0) {
            throw new Error(`No vote found for voter ${voterID} in election ${electionID}`);
        }

        const vote = JSON.parse(voteJSON.toString()) as PrivateVote;

        // Get public key
        const keysJSON = await ctx.stub.getState('ENCRYPTION_KEYS');
        if (!keysJSON || keysJSON.length === 0) {
            throw new Error('Encryption system not initialized');
        }

        const keys = JSON.parse(keysJSON.toString()) as EncryptionKeys;
        const publicKey = deserializePublicKey(keys.publicKey);
        const verifier = new Verifier(publicKey);

        // Parse the proofs
        const proofArrays = JSON.parse(vote.proofs, (key, value) => {
            if (typeof value === 'string' && /^\d+$/.test(value)) {
                return BigInt(value);
            }
            return value;
        }) as Proof[][];

        // Verify each set of proofs
        for (const proofSet of proofArrays) {
            const isValid = verifier.verifyNumber(proofSet, 60); // 60 minutes valid time
            if (!isValid) {
                return false;
            }
        }

        return true;
    }

    // Tally votes homomorphically
    @Transaction(false)
    @Returns('string')
    public async GetElectionResults(ctx: Context, electionID: string): Promise<string> {
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        if (!electionJSON || electionJSON.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }

        const election = JSON.parse(electionJSON.toString()) as Election;

        // Check if election is ended
        if (election.status !== ElectionStatus.ENDED && election.status !== ElectionStatus.RESULTS_DECLARED) {
            throw new Error(`Election ${electionID} is still active or results are not ready`);
        }

        // Get all votes for this election
        const iterator = ctx.stub.getStateByRange(`VOTE_${electionID}_`, `VOTE_${electionID}_\uffff`);

        // Get encryption keys
        const keysJSON = await ctx.stub.getState('ENCRYPTION_KEYS');
        if (!keysJSON || keysJSON.length === 0) {
            throw new Error('Encryption system not initialized');
        }

        const keys = JSON.parse(keysJSON.toString()) as EncryptionKeys;

        // Parse public and private keys
        const publicKey = deserializePublicKey(keys.publicKey);
        const privateKey = deserializePrivateKey(keys.privateKey, publicKey);

        // Prepare for homomorphic addition
        const tally: bigint[] = [];

        // Initialize tally array
        for (let i = 0; i < election.candidates.length; i++) {
            tally.push(publicKey.encrypt(BigInt(0)));
        }

        // Add up all the encrypted votes
        const votes = [];
        for await (const result of iterator) {
            if (result.value && result.value.toString()) {
                const vote = JSON.parse(result.value.toString()) as PrivateVote;
                votes.push(vote);

                // Add each encrypted ballot value to tally
                for (let i = 0; i < vote.encryptedBallot.length; i++) {
                    const encryptedValue = BigInt(vote.encryptedBallot[i]);
                    if (i < tally.length) {
                        tally[i] = publicKey.addition(tally[i], encryptedValue);
                    }
                }
            }
        }

        // Decrypt the final tally
        const decryptedResults = tally.map(encryptedSum => {
            const decrypted = privateKey.decrypt(encryptedSum);
            return Number(decrypted);
        });

        // Map to candidate results
        const finalResults = election.candidates.map((candidate, index) => ({
            candidateID: candidate.candidateID,
            name: candidate.name,
            party: candidate.party,
            voteCount: decryptedResults[index]
        }));

        // Sort by vote count (descending)
        finalResults.sort((a, b) => b.voteCount - a.voteCount);

        // Update election with results if not already set
        if (election.status === ElectionStatus.ENDED) {
            // election.status = ElectionStatus.RESULTS_DECLARED;
            election.results = finalResults;
            await ctx.stub.putState(electionKey, Buffer.from(stringify(election)));
        }

        return stringify(finalResults);
    }

    // Get vote information
    @Transaction(false)
    @Returns('string')
    public async GetVote(ctx: Context, electionID: string, voterID: string): Promise<string> {
        const voteKey = `VOTE_${electionID}_${voterID}`;
        const voteJSON = await ctx.stub.getState(voteKey);
        if (!voteJSON || voteJSON.length === 0) {
            throw new Error(`No vote found for voter ${voterID} in election ${electionID}`);
        }
        return voteJSON.toString();
    }

    // Update election status
    @Transaction()
    public async UpdateElectionStatus(ctx: Context, electionID: string, newStatus: string): Promise<void> {
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        if (!electionJSON || electionJSON.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }

        const election = JSON.parse(electionJSON.toString()) as Election;

        // Validate the status transition
        if (!Object.values(ElectionStatus).includes(newStatus as ElectionStatus)) {
            throw new Error(`Invalid election status: ${newStatus}`);
        }

        election.status = newStatus as ElectionStatus;
        await ctx.stub.putState(electionKey, Buffer.from(stringify(election)));
    }

    // Get all elections
    @Transaction(false)
    @Returns('string')
    public async GetAllElections(ctx: Context): Promise<string> {
        const startKey = 'ELECTION_';
        const endKey = 'ELECTION_\uffff';
        const iterator = ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        for await (const result of iterator) {
            const value = result.value.toString();
            try {
                const parsedValue = JSON.parse(value);
                // Check if it's an election object by looking for known properties
                if (parsedValue.electionID && parsedValue.name && parsedValue.candidates) {
                    allResults.push(parsedValue);
                }
            } catch (err) {
                console.log(err);
            }
        }

        return stringify(allResults);
    }

    // Get active elections
    @Transaction(false)
    @Returns('string')
    public async GetActiveElections(ctx: Context): Promise<string> {
        const allElectionsJSON = await this.GetAllElections(ctx);
        const allElections = JSON.parse(allElectionsJSON);

        const currentTime = this.getTransactionTimestamp(ctx);
        const activeElections = allElections.filter((election: Election) => {
            return currentTime >= election.startDate &&
                currentTime <= election.endDate &&
                election.status === ElectionStatus.ACTIVE;
        });

        return stringify(activeElections);
    }

    // Get voter's elections (elections where a voter is registered)
    @Transaction(false)
    @Returns('string')
    public async GetVoterElections(ctx: Context, voterID: string): Promise<string> {
        const allElectionsJSON = await this.GetAllElections(ctx);
        const allElections = JSON.parse(allElectionsJSON);

        const voterElections = allElections.filter((election: Election) => {
            return election.registeredVoters.includes(voterID);
        });

        return stringify(voterElections);
    }

    // Admin function to get vote counts (doesn't reveal individual votes)
    @Transaction(false)
    @Returns('string')
    public async GetVoteCount(ctx: Context, electionID: string): Promise<string> {
        const electionKey = this.getElectionKey(electionID);
        const electionJSON = await ctx.stub.getState(electionKey);
        if (!electionJSON || electionJSON.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }

        // Count votes using range query
        const iterator = ctx.stub.getStateByRange(`VOTE_${electionID}_`, `VOTE_${electionID}_\uffff`);

        let voteCount = 0;
        for await (const result of iterator) {
            if (result.value && result.value.toString()) {
                voteCount++;
            }
        }

        return stringify({ electionID, voteCount });
    }

    // Delete election (admin only)
    @Transaction()
    public async DeleteElection(ctx: Context, electionID: string): Promise<void> {
        const exists = await this.ElectionExists(ctx, electionID);
        if (!exists) {
            throw new Error(`Election ${electionID} does not exist`);
        }

        // Delete the election
        const electionKey = this.getElectionKey(electionID);
        await ctx.stub.deleteState(electionKey);

        // Also delete all votes for this election
        const iterator = ctx.stub.getStateByRange(`VOTE_${electionID}_`, `VOTE_${electionID}_\uffff`);
        for await (const result of iterator) {
            await ctx.stub.deleteState(result.key);
        }
    }
}
