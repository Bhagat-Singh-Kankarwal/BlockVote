import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaVoteYea, FaChartPie, FaInfoCircle } from 'react-icons/fa';
import ElectionDetailsModal from '../ElectionDetailsModal';

const ElectionCard = ({
  election,
  isRegistered,
  hasVoted,
  registerForElection,
  fetchingElections,
  onVote,
  index = 0
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Handle body scroll lock when modal is open
  useEffect(() => {
    let scrollPosition = 0;
    let scrollBarWidth = 0;

    if (showDetailsModal) {
      
      scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      scrollPosition = window.scrollY;

      // Lock the body at the current scroll position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      // Only restore if we previously set fixed positioning
      if (document.body.style.position === 'fixed') {

        const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));

        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        window.scrollTo({
          top: scrollY,
          behavior: 'instant'
        });
      }
    }

    // Clean up properly on unmount
    return () => {
      if (document.body.style.position === 'fixed') {
        const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo({
          top: scrollY,
          behavior: 'instant'
        });
      }
    };
  }, [showDetailsModal]);

  const formatTimeRemaining = (date) => {
    const now = new Date();
    const endDate = new Date(date);
    const diffMs = endDate - now;

    if (diffMs <= 0) return "Ended";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-sans font-bold text-gray-800">{election.name}</h3>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              Active
            </span>
          </div>

          <p className="text-gray-600 text-sm font-semibold mb-2">{election.description}</p>

          <div className="mb-5">
            <p className="text-sm text-primary-700 font-medium mb-2">
              {formatTimeRemaining(election.endDate)}
            </p>
          </div>

          <div className="flex justify-between flex-row flex-wrap gap-2 md:gap-0 md:items-center md:flex-row">
            {!isRegistered ? (
              <button
                onClick={() => registerForElection(election.electionID)}
                className="bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium rounded px-4 py-2 transition-colors flex items-center disabled:opacity-50 w-fit"
                disabled={fetchingElections}
              >
                {fetchingElections ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaVoteYea className="mr-2" />
                    Register
                  </>
                )}
              </button>
            ) : hasVoted ? (
              <div className="flex flex-col">
                <span className="text-green-600 text-sm font-semibold flex items-center">
                  <FaVoteYea className="mr-1 ml-1 md:ml-0" />
                  Voted: {'Your selected candidate'}
                </span>
              </div>
            ) : (
              <button
                onClick={onVote}
                className="bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium rounded px-4 py-2 transition-colors flex items-center w-fit"
              >
                <FaVoteYea className="mr-2" />
                Cast Vote
              </button>
            )}

            <button
              onClick={() => setShowDetailsModal(true)}
              className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-medium rounded px-4 py-2 transition-colors flex items-center w-fit"
            >
              <FaChartPie className="mr-2" />
              Details
            </button>
            
          </div>

          <div className="mt-4 flex items-center text-[10px] md:text-xs text-gray-500">
            <FaInfoCircle className="mr-1 w-[8px] h-[8px] md:w-[10px] md:h-[10px]" />
            <span className='font-sans'>Votes are encrypted and secured on the blockchain</span>
          </div>
        </div>
      </motion.div>

      {showDetailsModal && (
        <ElectionDetailsModal
          election={election}
          onClose={() => setShowDetailsModal(false)}
          isRegistered={isRegistered}
        />
      )}
    </>
  );
};

export default ElectionCard;