import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { FaCheck } from 'react-icons/fa';

const VoteCard = ({
  election,
  vote,
  copyToClipboard,
  index = 0
}) => {
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
            {/* <button className="ml-2 text-primary-600 hover:text-primary-800 transition-colors">
              <FaExternalLinkAlt size={12} />
            </button> */}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VoteCard;