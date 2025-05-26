import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FaPlus,
  FaTimes
} from 'react-icons/fa';
import api from '../utils/api';

// Import components
import AdminStatus from '../components/admin/AdminStatus';
import ElectionOverview from '../components/admin/ElectionOverview';
import AllElections from '../components/admin/AllElections';
import CreateElection from '../components/admin/CreateElection';
import AdvancedOperations from '../components/admin/AdvancedOperations';

import PublicElectionResults from '../components/PublicElectionResults';


function AdminDashboard() {
  const [adminStatus, setAdminStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);
  const [electionResults, setElectionResults] = useState({});
  const [isInitializingLedger, setIsInitializingLedger] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    // Check if any modal is open
    const isAnyModalOpen = showCreateModal || showResultsModal;
    let scrollPosition = 0;

    if (isAnyModalOpen) {
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
  }, [showCreateModal, showResultsModal]);

  useEffect(() => {
    // Verify admin token and fetch status
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Load elections when dashboard is opened
    if (adminStatus && adminStatus.status === 'enrolled') {
      fetchElections();
    }
  }, [adminStatus]);

  const checkAdminStatus = async () => {
    try {
      if (!localStorage.getItem('adminToken')) {
        // No token found, redirect to login
        navigate('/admin');
        return;
      }

      const response = await api.get('/fabric/admin/status');
      setAdminStatus(response.data);
    } catch (error) {
      console.error('Failed to verify admin status:', error);
      toast.error('Admin session invalid or expired');
      // Clear invalid token
      localStorage.removeItem('adminToken');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/elections');
      setElections(response.data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast.error('Failed to fetch elections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = async (electionData) => {
    try {
      setLoading(true);

      // Ensure dates are properly formatted for the blockchain
      const formattedData = {
        ...electionData
      };

      if (typeof formattedData.startDate !== 'number') {
        try {
          formattedData.startDate = new Date(formattedData.startDate).getTime();
        } catch (err) {
          console.error("Invalid startDate format:", formattedData.startDate);
          toast.error("Invalid start date format");
          return;
        }
      }

      if (typeof formattedData.endDate !== 'number') {
        try {
          formattedData.endDate = new Date(formattedData.endDate).getTime();
        } catch (err) {
          console.error("Invalid endDate format:", formattedData.endDate);
          toast.error("Invalid end date format");
          return;
        }
      }

      await api.post('/admin/elections', formattedData);

      toast.success('Election created successfully');
      setShowCreateModal(false);
      fetchElections();
    } catch (error) {
      console.error('Error creating election:', error);
      toast.error(error.response?.data?.details || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateElectionStatus = async (electionId, newStatus) => {
    try {
      setLoading(true);

      // Confirm before making certain status changes
      if (newStatus === 'CANCELED' && !window.confirm('Are you sure you want to cancel this election? This action may not be reversible.')) {
        setLoading(false);
        return;
      }

      if (newStatus === 'ENDED' && !window.confirm('Are you sure you want to end the election? This will finalize the election outcome.')) {
        setLoading(false);
        return;
      }

      await api.put(`/admin/elections/${electionId}/status`, {
        newStatus
      });

      const formattedStatus = newStatus
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      toast.success(`Election status updated to ${formattedStatus}`);
      fetchElections();
    } catch (error) {
      console.error('Error updating election status:', error);
      toast.error(`Failed to update election status: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (electionId) => {
    if (!window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/admin/elections/${electionId}`);
      toast.success('Election deleted successfully');
      fetchElections();
    } catch (error) {
      console.error('Error deleting election:', error);
      toast.error(error.response?.data?.details || 'Failed to delete election');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async (electionId) => {
    try {
      setLoading(true);
      const resultsResponse = await api.get(`/admin/elections/${electionId}/results`);
      const countResponse = await api.get(`/admin/elections/${electionId}/count`);

      // Find the election details
      const election = elections.find(e => e.electionID === electionId);

      if (!election) {
        console.warn(`Could not find election details for ID: ${electionId}`);
      }

      // Transform the vote results to match the component's expected format
      const transformedResults = resultsResponse.data.map(result => ({
        candidateName: result.name,
        candidateID: result.candidateID,
        count: result.voteCount,
        party: result.party
      }));

      setElectionResults({
        election,
        results: transformedResults,
        count: {
          totalVotes: countResponse.data.voteCount || 0
        }
      });

      setShowResultsModal(true);
    } catch (error) {
      console.error('Error fetching election results:', error);
      const errorMessage = error.response?.data?.details || error.message;
      toast.error(`Failed to fetch results: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeLedger = async () => {
    if (!window.confirm('Are you sure you want to initialize the ledger? This will reset all world state data. Elections and votes will still exist in the ledger.')) {
      return;
    }

    try {
      setIsInitializingLedger(true);
      await api.post('/initLedger', {});
      toast.success('Ledger initialized successfully');
      fetchElections();
    } catch (error) {
      console.error('Error initializing ledger:', error);
      toast.error('Failed to initialize ledger');
    } finally {
      setIsInitializingLedger(false);
    }
  };

  const initializeEncryptionSystem = async () => {
    if (!window.confirm('Are you sure you want to initialize the encryption system? This is typically done only once.')) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/initialize-encryption', { bitLength: 2048 });
      toast.success('Encryption system initialized successfully');
    } catch (error) {
      // console.error('Error initializing encryption system:', error);
      if (error.response?.status === 409) {
        toast.info('Encryption already initialized', {
          description: 'Encryption keys already exist in the ledger. For security reasons, keys cannot be overwritten.'
        });
      } else {
        // Handle other errors
        toast.error('Failed to initialize encryption system');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollAdmin = async () => {
    try {
      setLoading(true);
      await api.post('/fabric/admin/enroll', {});
      toast.success('Admin enrolled successfully');
      await checkAdminStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to enroll admin:', error);
      toast.error('Admin enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !adminStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md flex items-center space-x-4">
          <div className="animate-spin h-6 w-6 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          <div className="text-lg font-medium text-gray-700">Verifying admin credentials...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className='font-sans'>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="font-semibold text-base md:text-lg text-gray-600 font-quicksand">Manage elections and monitor blockchain voting activities</p>
            </div>
            <div className="mt-4 md:mt-0">
              {adminStatus?.status === 'enrolled' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white font-medium rounded-lg px-6 py-3 transition-all shadow-sm flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Create New Election
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            <div className="lg:col-span-1">
              {/* Admin Status Component */}
              <AdminStatus
                status={adminStatus}
                onRefresh={fetchElections}
                onEnroll={handleEnrollAdmin}
              />
            </div>
            <div className="lg:col-span-3">
              {/* Elections Overview Component */}
              <ElectionOverview
                elections={elections}
              />
            </div>
          </div>

          {/* Only show election management if admin is enrolled */}
          {adminStatus && adminStatus.status === 'enrolled' && (
            <>
              {/* Elections List */}
              <div className="mb-8">
                <AllElections
                  elections={elections}
                  onUpdateStatus={handleUpdateElectionStatus}
                  onDelete={handleDeleteElection}
                  onViewResults={handleViewResults}
                  loading={loading}
                />
              </div>

              {/* Advanced Operations Component */}
              <AdvancedOperations
                onInitializeLedger={handleInitializeLedger}
                onInitializeEncryption={initializeEncryptionSystem}
                isInitializingLedger={isInitializingLedger}
                loading={loading}
              />
            </>
          )}
        </motion.div>
      </div>

      {/* Create Election Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              // transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10">
                <div className="flex items-center">
                  <FaPlus className="text-secondary-600 text-xl mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900 font-quicksand">Create New Election</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="p-6">
                <CreateElection
                  onSubmit={handleCreateElection}
                  onClose={() => setShowCreateModal(false)}
                  loading={loading}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      {showResultsModal && (
        <PublicElectionResults
          electionId={electionResults.election.electionID}
          onClose={() => setShowResultsModal(false)}
        />
      )}
    </motion.div>
  );
}

export default AdminDashboard;