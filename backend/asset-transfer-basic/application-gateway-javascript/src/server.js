const supertokens = require("supertokens-node");
const Session = require("supertokens-node/recipe/session");
const EmailPassword = require("supertokens-node/recipe/emailpassword");
const EmailVerification = require("supertokens-node/recipe/emailverification")
const express = require("express");
const cors = require("cors");
const { middleware, errorHandler } = require("supertokens-node/framework/express");
const { verifySession } = require("supertokens-node/recipe/session/framework/express");

const helmet = require("helmet");

const { AuthRouter } = require("./auth.router");
const { VotingRouter } = require("./voting.router");
const { Connection } = require("./connection");

// Initialize SuperTokens
supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: process.env.SUPERTOKENS_URI || "http://localhost:3567",
    },
    appInfo: {
        appName: "super-auth",
        apiDomain: process.env.API_DOMAIN || "http://localhost:9010",
        websiteDomain: process.env.WEBSITE_DOMAIN || "http://localhost:5173",
        apiBasePath: "/auth",
        websiteBasePath: "/auth",
    },
    recipeList: [
        EmailVerification.init({
            mode: "REQUIRED",
        }),
        EmailPassword.init({
            override: {
                functions: (originalImplementation) => {
                    return {
                        ...originalImplementation,
                        signUp: async function (input) {
                            let response = await originalImplementation.signUp(input);
                            if (response.status === "OK" && response.user.loginMethods.length === 1 && input.session === undefined) {
                                console.log(`User registered successfully: ${response.user.id}`);
                            }
                            return response;
                        },
                        signIn: async function (input) {
                            let response = await originalImplementation.signIn(input);
                            if (response.status === "OK") {
                                console.log(`User authenticated: ${response.user.id}`);
                            }
                            return response;
                        }
                    }
                }
            }
        }),
        Session.init({
        })
    ]
});

// Create Express app
const app = express();

app.use(helmet());

// Configure CORS
app.use(
    cors({
        origin: ['http://localhost:5173'],
        allowedHeaders: ["content-type", "authorization", ...supertokens.getAllCORSHeaders()],
        credentials: true,
    }),
);

// Parse JSON bodies
app.use(express.json());

// SuperTokens middleware
app.use(middleware());

app.get('/hello', (req, res) => {
    res.json({ message: "Server is running!" });
});



async function initBlockchainConnection(connection) {
    try {
        await connection.init();
        console.log('Successfully connected to Fabric blockchain network');
    } catch (error) {
        console.error('Failed to initialize the Fabric connection:', error);
        process.exit(1);  // Exit if blockchain connection fails
    }
}

// Initialize the blockchain connection
const connection = new Connection();
initBlockchainConnection(connection);

// Periodic cleanup (every 1 minute)
setInterval(() => {
    if (typeof connection.cleanupIdleConnections === 'function') {
        console.log('Running connection cleanup...');
        connection.cleanupIdleConnections();
    }
}, 60 * 1000);

// Initialize the AuthRouter for Fabric functionality  
const authRouter = new AuthRouter();
authRouter.routes(app, verifySession);

// Initialize the VotingRouter for blockchain voting functionality
const votingRouter = new VotingRouter();
votingRouter.routes(app, verifySession, authRouter.verifyAdminToken.bind(authRouter));

// Start the election monitor to check for expired elections
votingRouter.startElectionMonitor(3600000); // Check every 1 hour

// Update the gracefulShutdown function to stop the monitor
function gracefulShutdown(connection) {
    console.log('Shutting down server...');
    connection.closeAllConnections();
    
    // Stop the election monitor
    if (votingRouter && typeof votingRouter.stopElectionMonitor === 'function') {
        votingRouter.stopElectionMonitor();
    }
    
    // Allow time for connections to close
    setTimeout(() => {
        console.log('Server shutdown complete');
        process.exit(0);
    }, 1000);
}

// Add SuperTokens error handler
app.use(errorHandler());

// Custom error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        message: "Internal server error",
    });
});

// Add shutdown handlers
process.on('SIGINT', () => gracefulShutdown(connection));
process.on('SIGTERM', () => gracefulShutdown(connection));

function gracefulShutdown(connection) {
    console.log('Shutting down server...');
    connection.closeAllConnections();
    // Allow time for connections to close
    setTimeout(() => {
        console.log('Server shutdown complete');
        process.exit(0);
    }, 1000);
}

// Start server
const PORT = process.env.PORT || 9010;
app.listen(PORT, () => {
    console.log('--------------------------------');
    console.log(`Server started on http://localhost:${PORT}`);
    console.log('--------------------------------');
});
