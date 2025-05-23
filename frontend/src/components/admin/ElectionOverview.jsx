import { useState, useEffect, useMemo } from 'react';
import { FaChartPie, FaCalendarAlt, FaVoteYea, FaCheck, FaUserCheck, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../../utils/api';

function ElectionOverview({ elections }) {
  const [resultData, setResultData] = useState({});
  const [loadingResults, setLoadingResults] = useState({});

  const activeElections = useMemo(() => 
    elections.filter(e => e.status === 'ACTIVE'), [elections]
  );
  
  const completedElections = useMemo(() => 
    elections.filter(e => e.status === 'ENDED' || e.status === 'RESULTS_DECLARED'), [elections]
  );
  
  const pendingElections = useMemo(() => 
    elections.filter(e => e.status === 'CREATED' || e.status === 'PAUSED'), [elections]
  );

  // Calculate total registered voters across all elections
  const totalRegisteredVoters = useMemo(() => 
    elections.reduce((total, election) => 
      total + (election.registeredVoters?.length || 0), 0), [elections]
  );

  // Fetch results for completed elections
  useEffect(() => {
    const fetchResultsForElection = async (election) => {
      if (!election || !election.electionID) return;
      if (election.status !== 'ENDED' && election.status !== 'RESULTS_DECLARED') return;
      
      // Skip if results already exists
      if (resultData[election.electionID]) return;
      
      setLoadingResults(prev => ({ ...prev, [election.electionID]: true }));
      
      try {
        const response = await api.get(`/elections/${election.electionID}/public-results`);
        setResultData(prev => ({
          ...prev,
          [election.electionID]: response.data
        }));
      } catch (err) {
        console.error(`Error fetching results for election ${election.electionID}:`, err);
      } finally {
        setLoadingResults(prev => ({ ...prev, [election.electionID]: false }));
      }
    };

    // Fetch results for the first 2 completed elections
    const recentCompletedElections = completedElections.slice(0, 2);
    recentCompletedElections.forEach(fetchResultsForElection);
  }, [completedElections, resultData]); // Add resultData to dependencies

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center mb-6">
        <div className="bg-secondary-50 p-2 rounded-lg">
          <FaChartPie className="text-secondary-600 text-xl" />
        </div>
        <h2 className="text-2xl font-semibold font-quicksand text-gray-900 ml-3">Elections Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-5 border border-primary-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-primary-700 mb-1 font-quicksand">Total Elections</h3>
            <div className="bg-white bg-opacity-50 p-1.5 rounded-full">
              <FaCalendarAlt className="text-primary-600 text-lg" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary-800 mb-1">{elections.length}</p>
          <div className="flex justify-between text-xs text-primary-600 font-medium">
            <span>Created: {elections.length}</span>
            <span>Voters: {totalRegisteredVoters}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-5 border border-secondary-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-secondary-700 mb-1 font-quicksand">Active Elections</h3>
            <div className="bg-white bg-opacity-50 p-1.5 rounded-full">
              <FaVoteYea className="text-secondary-600 text-lg" />
            </div>
          </div>
          <p className="text-3xl font-bold text-secondary-800 mb-1">
            {activeElections.length}
          </p>
          <div className="flex justify-between text-xs text-secondary-600 font-medium">
            <span>Ongoing: {activeElections.length}</span>
            <span>Pending: {pendingElections.length}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-green-700 mb-1 font-quicksand">Completed Elections</h3>
            <div className="bg-white bg-opacity-50 p-1.5 rounded-full">
              <FaCheck className="text-green-600 text-lg" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-800 mb-1">
            {completedElections.length}
          </p>
          <div className="flex justify-between text-xs text-green-600 font-medium">
            <span>Results Available: {completedElections.filter(e => e.status === 'ENDED').length}</span>
            <span>Ended: {completedElections.filter(e => e.status === 'ENDED').length}</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Results Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="border-t border-gray-100 pt-5 mt-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4 font-sans flex items-center">
            Recent Results
          </h3>

          {completedElections.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No completed elections yet.</p>
              <p className="text-xs text-gray-400 mt-1">Results will appear here once elections are completed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedElections.slice(0, 2).map((election) => {
                const isLoading = loadingResults[election.electionID];
                const results = resultData[election.electionID] || [];

                // Calculate total votes from results
                const totalVotes = results.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);

                // Find winner (if there is one)
                let winnerMessage = 'No votes have been cast';
                let winner = null;
                let tiedCandidates = [];

                if (totalVotes > 0) {
                  // Sort by vote count (highest first)
                  const sortedResults = [...results].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

                  // Check if we have a clear winner or a tie
                  if (sortedResults.length > 0) {
                    winner = sortedResults[0];

                    // Check for tie (if there are multiple candidates with the same highest vote count)
                    tiedCandidates = sortedResults.filter(c => c.voteCount === winner.voteCount);

                    if (tiedCandidates.length > 1) {
                      winnerMessage = `Tie between ${tiedCandidates.map(c => c.name).join(', ')}`;
                    } else {
                      winnerMessage = winner.name;
                    }
                  }
                }

                // Calculate participation percentage if voter data is available
                let participationRate = null;
                if (election.registeredVoters && election.registeredVoters.length > 0) {
                  participationRate = Math.round((totalVotes / election.registeredVoters.length) * 100);
                }

                return (
                  <motion.div
                    key={election.electionID}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{election.name}</h4>
                      <span className="text-xs md:text-sm text-gray-500">Ended: {formatDate(election.endDate)}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {election.description}
                    </p>

                    {isLoading ? (
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-secondary-500 mr-2" />
                        <span className="text-gray-600">Loading results...</span>
                      </div>
                    ) : !results || results.length === 0 ? (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <p className="text-gray-500">No results available for this election.</p>
                      </div>
                    ) : (
                      <div className={`bg-gray-50 p-3 rounded-lg border ${tiedCandidates.length > 1 ? 'border-yellow-200' : 'border-gray-200'}`}>
                        {totalVotes > 0 ? (
                          <>
                            <div className="flex items-center mb-1">
                              <div className={`w-3 h-3 rounded-full ${tiedCandidates.length > 1 ? 'bg-yellow-500' : 'bg-green-500'} mr-2`}></div>
                              <span className="font-medium text-gray-800">
                                {tiedCandidates.length > 1 ? 'Tie: ' : 'Winner: '}
                                {winnerMessage}
                              </span>
                            </div>


                            {participationRate !== null && (
                              <div className="mt-1 text-sm text-gray-500 flex items-center">
                                {/* <FaUserCheck className="text-secondary-500 mr-1" size={12} /> */}
                                <span>Participation rate: {participationRate}%</span>
                              </div>
                            )}

                          </>
                        ) : (
                          <div className="flex items-center">
                            <FaUserCheck className="text-secondary-500 mr-2" />
                            <span className="text-secondary-700">No votes were recorded for this election</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {completedElections.length > 2 && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  + {completedElections.length - 2} more completed election{completedElections.length - 2 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ElectionOverview;