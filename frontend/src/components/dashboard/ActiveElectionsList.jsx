import { FaVoteYea } from 'react-icons/fa';
import ElectionCard from './ElectionCard';

const ActiveElectionsList = ({
  activeElections,
  userElections,
  userVotes,
  registerForElection,
  fetchingElections,
  setSelectedElection,
  setShowVotingModal
}) => {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 md:p-6 border border-gray-100">
      <div className="flex items-center mb-2 md:mb-6">
        <FaVoteYea className="text-primary-600 text-xl mr-3" />
        <h2 className="text-2xl font-semibold text-gray-900">Active Elections</h2>
      </div>
      
      {activeElections.length === 0 ? (
        <div className="font-sans text-center py-8">
          <p className="text-gray-500">No active elections at the moment.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for upcoming votes.</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-6">
          {activeElections.map((election, index) => (
            <ElectionCard
              key={election.electionID}
              election={election}
              isRegistered={userElections.some(e => e.electionID === election.electionID)}
              hasVoted={userVotes[election.electionID]?.hasVoted}
              registerForElection={registerForElection}
              fetchingElections={fetchingElections}
              onVote={() => {
                setSelectedElection(election);
                setShowVotingModal(true);
              }}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveElectionsList;