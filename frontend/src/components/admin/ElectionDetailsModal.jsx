import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaChartPie
} from 'react-icons/fa';

function ElectionDetailsModal({
  election,
  onClose,
  onViewResults,
  voteCount = 0,
  isLoadingVotes = false
}) {
  if (!election) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getTimeRemainingDetailed = (dateString) => {
    const now = new Date();
    const endDate = new Date(dateString);
    const diffMs = endDate - now;

    if (diffMs <= 0) return "Ended";

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m`;

    return result;
  };

  const isCompleted = election.status === 'ENDED' || election.status === 'RESULTS_DECLARED';
  const totalRegistered = election.registeredVoters?.length || 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ marginTop: '0px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 font-quicksand">{election.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="font-sans text-gray-700">{election.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FaCalendarAlt className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Start Date</p>
                <p className="text-gray-800 font-semibold">{formatDate(election.startDate)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <FaCalendarAlt className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">End Date</p>
                <p className="text-gray-800 font-semibold">{formatDate(election.endDate)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <FaUsers className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Registered Voters</p>
                <p className="text-gray-800 font-semibold">
                  {totalRegistered} voters
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <FaClock className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <p className="text-gray-800 font-semibold">
                  {election.status === 'ACTIVE' || election.status === 'CREATED'
                    ? `${getTimeRemainingDetailed(election.endDate)} remaining`
                    : election.status
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Candidates</h3>
            {election.candidates && election.candidates.length > 0 ? (
              <div className="space-y-4">
                {election.candidates.map((candidate) => (
                  <div key={candidate.candidateID} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:shadow-sm transition-shadow">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full border-2 border-primary-500 bg-primary-200 mr-3 flex-shrink-0"></div>

                      <div className='flex justify-between w-full'>
                        <h4
                          className="font-semibold text-gray-800 text-base"
                          style={{ lineHeight: '1.8' }}
                        >
                          {candidate.name}
                        </h4>

                        <span className="bg-primary-50 text-primary-700 text-base px-2 py-1 rounded-md font-medium">
                          {candidate.party}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No candidates information available.</p>
            )}
          </div>

          {/* Add completed election statistics if available */}
          {isCompleted && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Election Statistics</h3>
              <div className="bg-secondary-50 border border-secondary-100 rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">

                  <div className='flex items-center gap-4 md:block'>
                    <p className="text-sm text-gray-500">Total Votes</p>
                    <p className="text-xl font-bold text-secondary-700">
                      {isLoadingVotes ? '...' : voteCount}
                    </p>
                  </div>

                  <div className='flex items-center gap-4 md:block'>
                    <p className="text-sm text-gray-500">Participation Rate</p>
                    <p className="text-xl font-bold text-secondary-700">
                      {isLoadingVotes ? '...' :
                        (totalRegistered
                          ? `${Math.round((voteCount / totalRegistered) * 100)}%`
                          : '0%'
                        )
                      }
                    </p>
                  </div>


                  <button
                    onClick={() => {
                      onClose();
                      onViewResults(election.electionID);
                    }}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded px-4 py-2 transition-colors flex items-center mt-2 md:mt-0"
                  >
                    <FaChartPie className="mr-2" />
                    View Results
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ElectionDetailsModal;