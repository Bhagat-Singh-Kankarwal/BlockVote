# BlockVote

A secure, transparent, and user-friendly blockchain-based voting platform.

## Project Overview

BlockVote is a modern web application that leverages blockchain technology to provide a secure and transparent electronic voting system. The platform supports multiple types of elections, identity management, tamper-proof results, and administrative controls.

## Key Features

- **Secure Blockchain-Based Voting**: Cast votes that are encrypted and stored on a blockchain ledger
- **Identity Management**: Create and manage secure blockchain identities for authentication
- **Election Management**: Admin tools to create, manage, and monitor elections
- **Tamper-Proof Results**: View election results with visual charts after elections are completed
- **User-Friendly Interface**: Intuitive design with responsive layout for all devices
- **Multi-level Authentication**: Separate secure login systems for voters and administrators

## Technology Stack

- **Frontend**: React 18, Vite 6
- **UI/Styling**: TailwindCSS, Framer Motion
- **Authentication**: SuperTokens
- **Data Visualization**: Chart.js
- **Icons**: React Icons, Heroicons
- **API Integration**: Axios
- **Routing**: React Router
- **Notifications**: Sonner

## Project Structure

The project follows a modular structure:

```
src/
├── App.jsx                 # Main application component with routing
├── index.css               # Global styles and Tailwind configuration
├── main.jsx                # Entry point
├── assets/                 # Static assets (fonts, images)
├── components/             # Reusable UI components
│   ├── admin/              # Admin-specific components
│   └── dashboard/          # User dashboard components
├── pages/                  # Top-level page components
└── utils/                  # Utility functions and API configuration
```

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- npm

### Installation

1. Change directory:
   ```
   cd blockvote
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_API_URL=http://localhost:9010
   VITE_WEBSITE_DOMAIN=http://localhost:5173
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```
npm run build
```

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

## License

This project is licensed under the [Business Source License 1.1](LICENSE.txt) (BUSL-1.1).

The BUSL is a non-open source license that automatically converts to an open source license (GNU General Public License v2.0 or later) after twenty years. The license allows:
- Free use for non-production environments
- Free use for evaluation, development, and testing
- Commercial use requires a separate license from the project maintainers

Change Date: May 18, 2045

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.