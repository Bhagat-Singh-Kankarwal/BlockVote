import { FaHistory } from 'react-icons/fa';
import CompletedElectionCard from './CompletedElectionCard';

const CompletedElectionsList = ({
  completedElections,
  setSelectedCompletedElection,
  setShowResultsModal
}) => {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 md:p-6 border border-gray-100 col-span-1 md:col-span-2">
      <div className="flex items-center mb-6">
        <FaHistory className="text-purple-600 text-xl mr-3" />
        <h2 className="text-2xl font-semibold text-gray-900">Past Elections with Results</h2>
      </div>
      
      {completedElections.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No completed elections yet.</p>
          <p className="text-gray-400 text-sm mt-2">Past elections will appear here once they end.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedElections.map((election, index) => (
            <CompletedElectionCard
              key={election.electionID}
              election={election}
              onViewResults={() => {
                setSelectedCompletedElection(election);
                setShowResultsModal(true);
              }}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedElectionsList;