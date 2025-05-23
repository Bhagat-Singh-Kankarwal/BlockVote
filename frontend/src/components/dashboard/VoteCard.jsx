import { motion } from 'framer-motion';
import { useState } from 'react';
import { ClipboardDocumentIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

import api from '../../utils/api';

import { FaCheck, FaSpinner } from 'react-icons/fa';

const VoteCard = ({
  election,
  vote,
  copyToClipboard,
  index = 0,
  userCredentials // Add this prop to pass user credentials
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerifyMyBallot = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const response = await api.post(`/elections/${election.electionID}/verify-my-ballot`, {
        credentials: userCredentials
      });

      const result = response.data;
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        isValid: false,
        error: error.message || 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="border-b border-gray-200 pb-5 last:border-0 last:pb-0"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-sans font-medium text-gray-800">{election.name}</h3>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
          Recorded
        </span>
      </div>
      
      <p className="font-sans text-sm text-gray-500 mt-1">
        {new Date(vote.timestamp || Date.now()).toLocaleString("en-GB", { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        })}
      </p>
      
      <div className="mt-3 bg-gray-50 p-3 rounded-lg hidden md:block">
        <div className="flex items-center">
          <FaCheck className="text-primary-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            Your vote was securely recorded using homomorphic encryption
          </span>
        </div>
      </div>
      
      {vote.transactionID && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 font-sans mb-1">Transaction ID:</p>
          <div className="flex items-center">
            <code className="text-xs bg-gray-100 p-1 rounded font-mono overflow-hidden text-ellipsis flex-1">
              {vote.transactionID}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(vote.transactionID);
              }}
              className="ml-2 text-primary-600 hover:text-primary-800 transition-colors"
              title="Copy transaction ID"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Self Ballot Verification Section */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-sans">Verify My Ballot:</span>
          <button
            onClick={handleVerifyMyBallot}
            disabled={isVerifying || !userCredentials}
            className="flex items-center text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Verify your ballot cryptographic proofs"
          >
            {isVerifying ? (
              <>
                <FaSpinner className="animate-spin mr-1" size={10} />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                Verify
              </>
            )}
          </button>
        </div>
        
        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className={`mt-2 p-2 rounded text-xs font-sans ${
              verificationResult.isValid
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <div className="flex items-center">
              {verificationResult.isValid ? (
                <>
                  <FaCheck className="mr-1" size={10} />
                  <span className="font-medium">Your Ballot is Valid</span>
                </>
              ) : (
                <>
                  <span className="mr-1">⚠️</span>
                  <span className="font-medium">Verification Failed</span>
                </>
              )}
            </div>
            {/* <p className="mt-1 text-xs opacity-75">
              {verificationResult.message}
            </p> */}
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default VoteCard;