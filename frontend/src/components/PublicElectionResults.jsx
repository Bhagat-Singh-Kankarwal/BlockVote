import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaChartPie, FaTimes, FaInfoCircle, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import api from '../utils/api';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

function PublicElectionResults({ electionId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [election, setElection] = useState(null);

  // Colors for the result bars
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Add a chart reference
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const totalVotes = results ? results.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0) : 0;
  

  // Create/update chart when results change
  useEffect(() => {
    if (!chartRef.current || !results || totalVotes === 0) return;

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: results.map(result => result.name),
        datasets: [{
          data: results.map(result => result.voteCount),
          backgroundColor: results.map((_, index) => colors[index % colors.length]),
          borderWidth: 0,
          cutout: '90%', // Make a thin donut
          borderRadius: 0,
          spacing: 0, // Small spacing between segments
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Hide default legend
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                const percentage = ((value / totalVotes) * 100).toFixed(1);
                return `${context.label}: ${value} votes (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 800
        }
      }
    });

    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [results, totalVotes, colors]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // First get the election details
        const electionResponse = await api.get(`/elections/${electionId}`);
        setElection(electionResponse.data);

        // Only try to fetch results if status is RESULTS_DECLARED
        if (electionResponse.data.status === 'RESULTS_DECLARED' || electionResponse.data.status === 'ENDED') {
          const resultsResponse = await api.get(`/elections/${electionId}/public-results`);
          setResults(resultsResponse.data);
        } else {
          setError('Results have not been officially declared yet');
        }
      } catch (err) {
        console.error('Error fetching election results:', err);
        setError(err.response?.data?.details || 'Failed to fetch election results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [electionId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50"
      >
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading election results...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <FaChartPie className="text-secondary-600 text-xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Election Results</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-lg mb-6">
            <p className="font-semibold text-lg mb-2">Results Not Available</p>
            <p className="mb-2">{error}</p>
            {election && election.status !== 'RESULTS_DECLARED' && (
              <div className="flex items-center mt-3 text-amber-700">
                <FaInfoCircle className="mr-2" />
                <p className="text-sm font-medium">
                  Current status: {election.status.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg px-6 py-2 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (!results || !election) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <FaChartPie className="text-secondary-600 text-xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Election Results</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg text-center">
            <p className="text-gray-600">No results data available</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Calculate total votes
  // const totalVotes = results.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-1 md:gap-0 mb-6">
          <div className="flex items-center">
            <FaChartPie className="text-secondary-600 text-xl mr-3" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Official Election Results</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{election.name}</h3>
          <p className="text-gray-600 mb-4">{election.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <FaCalendarAlt className="mr-2 text-primary-500" />
              <span>Ended: {formatDate(election.endDate)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaUsers className="mr-2 text-primary-500" />
              <span>Total Votes: {totalVotes}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Winner Card */}
          <div className={`bg-gradient-to-br ${tiedCandidates?.length > 1 ?
            'from-white to-yellow-50 border-yellow-100' :
            'from-white to-green-50 border-green-100'} 
            p-6 rounded-xl border shadow-sm`}>
            <h4 className="text-lg font-bold text-gray-800 mb-4">Election Winner</h4>

            {totalVotes > 0 ? (
              <div className="text-center">
                <div className={`inline-flex items-center justify-center ${tiedCandidates?.length > 1 ? 'bg-yellow-100' : 'bg-green-100'
                  } h-20 w-20 rounded-full mb-3`}>
                  {tiedCandidates?.length > 1 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{winnerMessage}</h3>
                {winner && (
                  <p className={`${tiedCandidates?.length > 1 ? 'text-yellow-700' : 'text-green-700'} font-medium`}>
                    {winner.voteCount} votes ({Math.round((winner.voteCount / totalVotes) * 100)}%)
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No votes have been cast in this election</p>
              </div>
            )}
          </div>

          {/* Vote Distribution */}
          {/* <div className='hidden md:block'>
            <h4 className="font-semibold text-gray-800 mb-4">Vote Distribution</h4>
            <div className="flex items-center justify-center h-48 mb-4">
              <div className="relative h-40 w-40">
                <div className="h-full w-full rounded-full border-8 border-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{totalVotes}</p>
                    <p className="text-sm text-gray-500">Total Votes</p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          <div className='block'>
            <h4 className="font-semibold text-gray-800 mb-4">Vote Distribution</h4>
            <div className="flex flex-col items-center">
              {totalVotes > 0 ? (
                <>
                  <div className="relative h-60 w-60">
                    {/* Canvas for chart */}
                    <canvas ref={chartRef}></canvas>

                    {/* Center text overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{totalVotes}</p>
                        <p className="text-xs text-gray-500">Total Votes</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom legend below chart */}
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {results.map((result, index) => (
                      <div key={result.candidateID} className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-1.5"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-xs font-medium text-gray-700">
                          {result.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 w-40 rounded-full border-4 border-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-medium text-gray-400">No votes</p>
                  </div>
                </div>
              )}
            </div>
          </div>



        </div>

        <h4 className="font-semibold text-gray-800 mb-4">Final Results</h4>
        <div className="space-y-4 mb-8">
          {results.map((result, index) => (
            <div key={result.candidateID} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="font-medium text-gray-800">{result.name}</span>
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100) : 0}%
                </span>
              </div>

              <div className="w-full bg-gray-200 h-2 md:h-3 rounded-full">
                <div
                  className="h-2 md:h-3 rounded-full"
                  style={{
                    width: totalVotes > 0 ? `${(result.voteCount / totalVotes) * 100}%` : '0%',
                    backgroundColor: colors[index % colors.length]
                  }}
                ></div>
              </div>

              <p className="mt-2 text-sm text-gray-600 text-right">{result.voteCount} votes</p>
            </div>
          ))}
        </div>

      </motion.div>
    </motion.div>
  );
}

export default PublicElectionResults;