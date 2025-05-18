import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaList,
  FaSearch,
  FaPause,
  FaPlay,
  FaChartPie,
  FaSpinner,
  FaCheckCircle,
  FaFlagCheckered,
  FaInfoCircle,
} from 'react-icons/fa';

import api from '../../utils/api';
import ElectionDetailsModal from './ElectionDetailsModal';

function AllElections({ elections, onUpdateStatus, onDelete, onViewResults, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [voteCounts, setVoteCounts] = useState({});
  const [loadingVotes, setLoadingVotes] = useState({});
  const [selectedElection, setSelectedElection] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // useEffect(() => {

  //   // Add/remove the no-scroll class on the body
  //   if (showDetailsModal) {
  //     document.body.classList.add('overflow-hidden');

  //     // Store the original scroll position
  //     document.body.dataset.scrollY = window.scrollY.toString();
  //     const scrollY = window.scrollY

  //     // Optional: fix the position to prevent jumping
  //     document.body.style.position = 'fixed';
  //     document.body.style.top = `-${scrollY}px`;
  //     document.body.style.width = '100%';
  //   } else {
  //     // Restore body scrolling
  //     document.body.classList.remove('overflow-hidden');

  //     // Optional: restore the scroll position if it was saved
  //     if (document.body.style.position === 'fixed') {
  //       document.body.style.position = '';
  //       document.body.style.top = '';
  //       document.body.style.width = '';

  //       // Scroll back to the original position
  //       const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
  //       window.scrollTo({
  //         top: scrollY,
  //         behavior: 'instant'
  //       });
  //     }
  //   }

  //   // Cleanup function
  //   return () => {
  //     const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
  //     document.body.classList.remove('overflow-hidden');
  //     document.body.style.position = '';
  //     document.body.style.top = '';
  //     document.body.style.width = '';
  //     window.scrollTo({
  //       top: scrollY,
  //       behavior: 'instant'
  //     });
  //     // document.body.dataset.scrollY = ''; // Clear the scroll position
  //   };
  // }, [showDetailsModal]);

  useEffect(() => {
    let scrollPosition = 0;

    if (showDetailsModal) {
      // Save the current scroll position
      scrollPosition = window.scrollY;

      // Lock the body at the current scroll position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Only restore if we previously set fixed positioning
      if (document.body.style.position === 'fixed') {
        // Get the scroll position from the body top offset
        const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));

        // First restore all styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // Then scroll to the original position
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
        window.scrollTo({
          top: scrollY,
          behavior: 'instant'
        });
      }
    };
  }, [showDetailsModal]);

  // Fetch vote counts for completed elections
  useEffect(() => {
    const fetchVoteCountForElection = async (election) => {
      // Skip if not ENDED or already loaded
      if (election.status !== 'ENDED' && election.status !== 'RESULTS_DECLARED') return;
      if (voteCounts[election.electionID]) return;

      if (window.innerWidth < 768 && !showDetailsModal) return;

      try {
        setLoadingVotes(prev => ({ ...prev, [election.electionID]: true }));
        const result = await api.get(`/elections/${election.electionID}/public-results`);

        // Calculate total votes from results
        const totalVotes = result.data.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);

        setVoteCounts(prev => ({
          ...prev,
          [election.electionID]: totalVotes
        }));
      } catch (error) {
        console.error(`Error fetching votes for election ${election.electionID}:`, error);
        // Set to 0 on error to avoid repeated failed requests
        setVoteCounts(prev => ({ ...prev, [election.electionID]: 0 }));
      } finally {
        setLoadingVotes(prev => ({ ...prev, [election.electionID]: false }));
      }
    };

    // Get only elections that need vote data
    const electionsNeedingVotes = elections.filter(e =>
      (e.status === 'ENDED' || e.status === 'RESULTS_DECLARED') &&
      // On mobile, only load for the selected election when modal is open
      (window.innerWidth >= 768 || (showDetailsModal && selectedElection?.electionID === e.electionID))
    );

    electionsNeedingVotes.forEach(fetchVoteCountForElection);
  }, [elections, showDetailsModal, selectedElection]);

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

  const getTimeRemaining = (dateString) => {
    const now = new Date();
    const endDate = new Date(dateString);
    const diffMs = endDate - now;

    if (diffMs <= 0) return 'Ended';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
    // if (days > 0) {
    //   return `${days}d ${hours}h remaining`;
    // }
    // return `${hours}h remaining`;
  };

  const getStatusClass = (status) => {
    // Normalize status for comparison
    const normalizedStatus = status.toUpperCase();

    switch (normalizedStatus) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'ENDED': return 'bg-blue-100 text-blue-700';
      case 'RESULTS_DECLARED': return 'bg-purple-100 text-purple-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      case 'CREATED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter elections based on search term and filter
  const filteredElections = elections
    .filter(election => {
      if (filter === 'active') return election.status === 'ACTIVE';
      if (filter === 'paused') return election.status === 'PAUSED';
      if (filter === 'completed') return election.status === 'ENDED' || election.status === 'RESULTS_DECLARED';
      return true; // 'all' filter
    })
    .filter(election =>
      election.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // New function to show election details
  const handleShowDetails = (election) => {
    setSelectedElection(election);
    setShowDetailsModal(true);
  };

  // Function to close the details modal
  const handleCloseModal = () => {
    setShowDetailsModal(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center mb-6">
          <FaList className="text-secondary-600 text-xl mr-3" />
          <h2 className="text-2xl font-semibold font-quicksand text-gray-900">All Elections</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-secondary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <FaList className="text-secondary-600 text-xl mr-3" />
        <h2 className="text-2xl font-semibold font-quicksand text-gray-900">All Elections</h2>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search elections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md ${filter === 'all'
              ? 'bg-secondary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md ${filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md ${filter === 'paused'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Paused
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md ${filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredElections.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No elections found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Election
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredElections.map((election) => {
                  const isCompleted = election.status === 'ENDED' || election.status === 'RESULTS_DECLARED';
                  const isLoadingVotes = loadingVotes[election.electionID];
                  const totalVotes = voteCounts[election.electionID] || 0;
                  const totalRegistered = election.registeredVoters?.length || 0;

                  return (
                    <motion.tr
                      key={election.electionID}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {election.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {election.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(election.status)}`}>
                          {election.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          Created: {formatDate(election.createdAt || election.startDate)}
                        </div>
                        <div className="text-xs font-medium text-gray-700 mt-1">
                          {election.status === 'ACTIVE' || election.status === 'CREATED'
                            ? getTimeRemaining(election.endDate)
                            : `Ended: ${formatDate(election.endDate)}`
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 mr-4">
                            {isCompleted && isLoadingVotes ? (
                              <div className="flex items-center text-xs text-gray-500 mb-1">
                                <FaSpinner className="animate-spin mr-1" />
                                <span>Loading votes...</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 mb-1">
                                {isCompleted ? `${totalVotes}/${totalRegistered} votes` : `${totalRegistered} registered voters`}
                              </div>
                            )}
                            <div className="w-full bg-gray-200 h-2 rounded-full">
                              <div
                                className="bg-secondary-500 h-2 rounded-full"
                                style={{
                                  width: isCompleted && totalRegistered > 0
                                    ? `${(totalVotes / totalRegistered) * 100}%`
                                    : '0%'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Add Info button that appears for all elections */}
                          <button
                            onClick={() => handleShowDetails(election)}
                            className="text-gray-600 hover:text-gray-800"
                            title="View Details"
                          >
                            <FaInfoCircle />
                          </button>

                          {election.status === 'CREATED' && (
                            <button
                              onClick={() => onUpdateStatus(election.electionID, 'ACTIVE')}
                              className="text-green-600 hover:text-green-800"
                              title="Activate Election"
                            >
                              <FaCheckCircle />
                            </button>
                          )}

                          {election.status === 'ACTIVE' && (
                            <button
                              onClick={() => onUpdateStatus(election.electionID, 'PAUSED')}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Pause Election"
                            >
                              <FaPause />
                            </button>
                          )}

                          {election.status === 'PAUSED' && (
                            <button
                              onClick={() => onUpdateStatus(election.electionID, 'ACTIVE')}
                              className="text-green-600 hover:text-green-800"
                              title="Reactivate Election"
                            >
                              <FaPlay />
                            </button>
                          )}

                          {(election.status === 'ACTIVE' || election.status === 'PAUSED') && (
                            <button
                              onClick={() => onUpdateStatus(election.electionID, 'ENDED')}
                              className="text-blue-600 hover:text-blue-800"
                              title="End Election"
                            >
                              <FaFlagCheckered />
                            </button>
                          )}

                          {(election.status === 'ENDED' || election.status === 'RESULTS_DECLARED') && (
                            <button
                              onClick={() => onViewResults(election.electionID)}
                              className="text-secondary-600 hover:text-secondary-800"
                              title="View Results"
                            >
                              <FaChartPie />
                            </button>
                          )}

                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile view - simplified cards */}
          <div className="md:hidden">
            <div className="space-y-4">
              {filteredElections.map((election) => {
                const isCompleted = election.status === 'ENDED' || election.status === 'RESULTS_DECLARED';

                return (
                  <motion.div
                    key={election.electionID}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex flex-col justify-between items-start">
                      <div className="flex-1 mb-2">
                        <h3 className="font-medium text-gray-900">{election.name}</h3>
                        <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(election.status)}`}>
                          {election.status}
                        </span>
                      </div>

                      <div className="flex justify-around space-x-2 w-full border-t border-gray-200 pt-1">
                        {/* Always show details button */}
                        <button
                          onClick={() => handleShowDetails(election)}
                          className="text-gray-600 hover:text-gray-800 p-2"
                          title="View Details"
                        >
                          <FaInfoCircle size={16} />
                        </button>

                        {/* Primary action based on status */}
                        {election.status === 'CREATED' && (
                          <button
                            onClick={() => onUpdateStatus(election.electionID, 'ACTIVE')}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Activate Election"
                          >
                            <FaCheckCircle size={16} />
                          </button>
                        )}

                        {election.status === 'ACTIVE' && (
                          <button
                            onClick={() => onUpdateStatus(election.electionID, 'PAUSED')}
                            className="text-yellow-600 hover:text-yellow-800 p-2"
                            title="Pause Election"
                          >
                            <FaPause size={16} />
                          </button>
                        )}

                        {election.status === 'PAUSED' && (
                          <button
                            onClick={() => onUpdateStatus(election.electionID, 'ACTIVE')}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Reactivate Election"
                          >
                            <FaPlay size={16} />
                          </button>
                        )}

                        {(election.status === 'ACTIVE' || election.status === 'PAUSED') && (
                          <button
                            onClick={() => onUpdateStatus(election.electionID, 'ENDED')}
                            className="text-blue-600 hover:text-blue-800 p-2"
                            title="End Election"
                          >
                            <FaFlagCheckered />
                          </button>
                        )}

                        {(election.status === 'ENDED' || election.status === 'RESULTS_DECLARED') && (
                          <button
                            onClick={() => onViewResults(election.electionID)}
                            className="text-secondary-600 hover:text-secondary-800 p-2"
                            title="View Results"
                          >
                            <FaChartPie size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Election Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedElection && (
          <ElectionDetailsModal
            election={selectedElection}
            onClose={handleCloseModal}
            onViewResults={onViewResults}
            voteCount={voteCounts[selectedElection.electionID] || 0}
            isLoadingVotes={loadingVotes[selectedElection.electionID] || false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AllElections;