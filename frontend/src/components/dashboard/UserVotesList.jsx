import { FaHistory } from 'react-icons/fa';
import VoteCard from './VoteCard';

const UserVotesList = ({
  userVotes,
  userElections,
  copyToClipboard
}) => {
  const votedElectionIds = Object.keys(userVotes).filter(id => userVotes[id]?.hasVoted);
  const needsScrolling = votedElectionIds.length > 2;

  return (
    <div className="bg-white rounded-xl shadow-card p-4 md:p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <FaHistory className="text-secondary-600 text-xl mr-3" />
        <h2 className="text-2xl font-semibold text-gray-900">Your Votes</h2>
      </div>
      
      {votedElectionIds.length === 0 ? (
        <div className="text-center py-8 font-sans">
          <p className="text-gray-500">You haven't cast any votes yet.</p>
          <p className="text-gray-400 text-sm mt-2">Your voting history will appear here.</p>
        </div>
      ) : (
        <div 
          className={`space-y-5 ${needsScrolling ? 'max-h-96 overflow-y-auto pr-2 custom-scrollbar' : ''}`}
        >
          {votedElectionIds.map((electionId, index) => {
            const election = userElections.find(e => e.electionID === electionId) || {};
            const vote = userVotes[electionId]?.vote || {};
            
            return (
              <VoteCard
                key={electionId}
                election={election}
                vote={vote}
                copyToClipboard={copyToClipboard}
                index={index}
              />
            );
          })}
        </div>
      )}
      
      {needsScrolling && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">Scroll to see more votes</p>
        </div>
      )}
      
    </div>
  );
};

export default UserVotesList;