import { motion } from 'framer-motion';
import ActiveElectionsList from './ActiveElectionsList';
import UserVotesList from './UserVotesList';
import CompletedElectionsList from './CompletedElectionsList';

const ElectionsContainer = ({
  fetchingElections,
  activeElections,
  userElections,
  userVotes,
  completedElections,
  registerForElection,
  copyToClipboard,
  setSelectedElection,
  setShowVotingModal,
  setSelectedCompletedElection,
  setShowResultsModal
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl font-quicksand"
    >
      {fetchingElections && activeElections.length === 0 && userElections.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading elections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ActiveElectionsList
              activeElections={activeElections}
              userElections={userElections}
              userVotes={userVotes}
              registerForElection={registerForElection}
              fetchingElections={fetchingElections}
              setSelectedElection={setSelectedElection}
              setShowVotingModal={setShowVotingModal}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <UserVotesList
              userVotes={userVotes}
              userElections={userElections}
              copyToClipboard={copyToClipboard}
            />
          </motion.div>

          {completedElections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="col-span-1 md:col-span-2"
            >
              <CompletedElectionsList
                completedElections={completedElections}
                setSelectedCompletedElection={setSelectedCompletedElection}
                setShowResultsModal={setShowResultsModal}
              />
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ElectionsContainer;