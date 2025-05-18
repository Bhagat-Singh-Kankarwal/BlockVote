import { useState, useEffect } from 'react';
import { useSessionContext, getUserId } from 'supertokens-auth-react/recipe/session';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';

import IdentitySetup from '../components/dashboard/IdentitySetup';
import ElectionsContainer from '../components/dashboard/ElectionsContainer';
import VotingModal from '../components/VotingModal';
import PublicElectionResults from '../components/PublicElectionResults';

const VotingDashboard = () => {
  const sessionContext = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [hasIdentity, setHasIdentity] = useState(false);
  const [identityFile, setIdentityFile] = useState(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isRegisteredButMissingFile, setIsRegisteredButMissingFile] = useState(false);

  // Elections state
  const [activeElections, setActiveElections] = useState([]);
  const [userElections, setUserElections] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [fetchingElections, setFetchingElections] = useState(false);
  const [completedElections, setCompletedElections] = useState([]);
  
  // Modal state
  const [selectedElection, setSelectedElection] = useState(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [selectedCompletedElection, setSelectedCompletedElection] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);


  
  // Initialize user and check identity
  useEffect(() => {
    if (sessionContext.loading === false && sessionContext.doesSessionExist) {
      getUserId().then(id => {
        setUserId(id);
        
        // Check if identity exists in localStorage first
        const storedIdentity = localStorage.getItem(`blockchain_identity_${id}`);
        if (storedIdentity) {
          try {
            setIdentityFile(JSON.parse(storedIdentity));
            setHasIdentity(true);
            setLoading(false);
          } catch (err) {
            console.error('Error parsing stored identity:', err);
            checkFabricIdentity(true);
          }
        } else {
          checkFabricIdentity(true);
        }
      });
    }
  }, [sessionContext.loading]);

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (showResultsModal || showVotingModal) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      
      // Add styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';
    } else {
      // If modal is closed, restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    
    // Clean up when component unmounts
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [showResultsModal, showVotingModal]);

  // Load elections when identity is available
  useEffect(() => {
    if (hasIdentity && identityFile) {
      fetchActiveElections();
      fetchUserElections();
      fetchCompletedElections();
    }
  }, [hasIdentity, identityFile]);

  // Check if user has fabric identity registered
  const checkFabricIdentity = async (localIdentityMissing = false) => {
    try {
      const response = await api.get('/fabric/identity/check');
      if (response.data.registered && localIdentityMissing) {
        toast.warning('Your blockchain identity file is missing. Please upload it.');
        setIsRegisteredButMissingFile(true);
        setHasIdentity(false);
      } else {
        setHasIdentity(response.data.registered);
        setIsRegisteredButMissingFile(false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking fabric identity:', error);
      toast.error('Failed to check blockchain identity status');
      setLoading(false);
    }
  };

  // Create and store identity file
  const registerWithFabric = async () => {
    try {
      setLoading(true);
      const response = await api.post('/fabric/register');
      
      const identityData = response.data.identityFile;
      setIdentityFile(identityData);
      
      if (userId) {
        localStorage.setItem(`blockchain_identity_${userId}`, JSON.stringify(identityData));
      }
      
      setShowDownloadPrompt(true);
      setHasIdentity(true);
      toast.success('Blockchain identity created successfully');
    } catch (error) {
      console.error('Error registering with fabric:', error);
      toast.error('Failed to create blockchain identity');
    } finally {
      setLoading(false);
    }
  };

  // Handle identity file upload
  const handleIdentityFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const identityData = JSON.parse(event.target.result);
        if (!identityData) {
          throw new Error('Invalid identity file format');
        }

        setIdentityFile(identityData);
        localStorage.setItem(`blockchain_identity_${userId}`, JSON.stringify(identityData));
        setHasIdentity(true);
        setIsRegisteredButMissingFile(false);
        toast.success('Identity file successfully restored');
      } catch (error) {
        console.error('Error parsing identity file:', error);
        toast.error('Invalid identity file format');
      }
    };

    reader.readAsText(file);
  };

  // Download identity file
  const downloadIdentityFile = () => {
    if (!identityFile) return;

    const blob = new Blob([JSON.stringify(identityFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = userId
      ? `blockchain_identity_${userId}.json`
      : `blockchain_identity_${Date.now()}.json`;
      
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    setShowDownloadPrompt(false);
  };

  // Election data fetching functions
  const fetchActiveElections = async () => {
    try {
      setFetchingElections(true);
      const response = await api.get('/elections/active');
      setActiveElections(response.data || []);
    } catch (error) {
      console.error('Error fetching active elections:', error);
      toast.error('Failed to fetch active elections');
    } finally {
      setFetchingElections(false);
    }
  };

  const fetchUserElections = async () => {
    if (!identityFile) return;
    
    try {
      setFetchingElections(true);
      const response = await api.post('/user/elections', {
        credentials: identityFile
      });
      
      const userElectionData = response.data || [];
      setUserElections(userElectionData);
      
      // Get votes for each election
      const votes = {};
      await Promise.all(
        userElectionData.map(async (election) => {
          try {
            const voteResponse = await api.post(`/elections/${election.electionID}/voted`, {
              credentials: identityFile
            });
            votes[election.electionID] = voteResponse.data;
          } catch (error) {
            console.error(`Error checking vote for election ${election.electionID}:`, error);
          }
        })
      );
      
      setUserVotes(votes);
    } catch (error) {
      console.error('Error fetching user elections:', error);
      toast.error('Failed to fetch your registered elections');
    } finally {
      setFetchingElections(false);
    }
  };

  const fetchCompletedElections = async () => {
    try {
      const response = await api.get('/elections');
      const declared = response.data.filter(
        election => election.status === 'RESULTS_DECLARED' || election.status === 'ENDED'
      );
      setCompletedElections(declared);
    } catch (error) {
      console.error('Error fetching completed elections:', error);
    }
  };

  // Election actions
  const registerForElection = async (electionId) => {
    if (!identityFile) {
      toast.error('Blockchain identity required to register');
      return;
    }
    
    try {
      setFetchingElections(true);
      await api.post(`/elections/${electionId}/register`, {
        credentials: identityFile
      });
      
      toast.success('Successfully registered for election');
      await fetchUserElections();
      await fetchActiveElections();
    } catch (error) {
      console.error(`Error registering for election ${electionId}:`, error);
      toast.error(error.response?.data?.details || 'Failed to register for election');
    } finally {
      setFetchingElections(false);
    }
  };

  const castVote = async (electionId, candidateId) => {
    if (!identityFile) {
      toast.error('Blockchain identity required to vote');
      return;
    }
    
    try {
      setVotingInProgress(true);
      
      const election = userElections.find(e => e.electionID === electionId) ||
        activeElections.find(e => e.electionID === electionId);
        
      if (!election) {
        toast.error('Election not found');
        return;
      }
      
      const candidateIndex = election.candidates.findIndex(c => c.candidateID === candidateId);
      if (candidateIndex === -1) {
        toast.error('Selected candidate not found in this election');
        return;
      }
      
      const response = await api.post(`/elections/${electionId}/vote`, {
        candidateIndex: candidateIndex,
        credentials: identityFile
      });
      
      let candidateName = "your selected candidate";
      if (election) {
        const candidate = election.candidates.find(c => c.candidateID === candidateId);
        if (candidate) candidateName = candidate.name;
      }
      
      const txId = response.data?.transactionID;
      const txIdMessage = txId ? `\nTransaction ID: ${txId.substring(0, 10)}...` : '';
      toast.success(`Vote cast successfully for ${candidateName}!${txIdMessage}`);
      setShowVotingModal(false);
      
      await fetchUserElections();
    } catch (error) {
      console.error(`Error casting vote in election ${electionId}:`, error);
      toast.error(error.response?.data?.details || 'Failed to cast vote');
    } finally {
      setVotingInProgress(false);
    }
  };

  // Copy to clipboard utility
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Transaction ID copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy transaction ID');
      });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-84px)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
          <div className="text-lg font-medium text-gray-700 font-quicksand">Loading your secure voting dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-84px)] bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto text-left mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-gray-800 font-sans">
            Secure Voting Dashboard
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-quicksand font-semibold">
            Cast your vote securely with blockchain technology
          </p>
        </motion.div>
        <div className="flex flex-col items-center justify-center">
          {!hasIdentity ? (
            <IdentitySetup 
              isRegisteredButMissingFile={isRegisteredButMissingFile}
              handleIdentityFileUpload={handleIdentityFileUpload}
              registerWithFabric={registerWithFabric}
              loading={loading}
            />
          ) : showDownloadPrompt ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow-card p-8 border border-gray-100 max-w-md w-full font-sans"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-quicksand">
                  Identity Created!
                </h2>
                <p className="text-gray-600 text-sm">Please download your identity file and keep it safe.</p>
              </div>

              <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-lg mb-6">
                <p className="font-medium text-sm">
                  Your identity has been saved in this browser for convenience, but we strongly recommend downloading a backup.
                </p>
              </div>

              <button
                onClick={downloadIdentityFile}
                className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium w-full mb-4 transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Identity File
              </button>

              <p className="text-xs text-gray-500 text-center">
                Note: If you clear your browser data, you'll need this file to restore your identity.
              </p>
            </motion.div>
          ) : (
            <ElectionsContainer
              fetchingElections={fetchingElections}
              activeElections={activeElections}
              userElections={userElections}
              userVotes={userVotes}
              completedElections={completedElections}
              registerForElection={registerForElection}
              copyToClipboard={copyToClipboard}
              setSelectedElection={setSelectedElection}
              setShowVotingModal={setShowVotingModal}
              setSelectedCompletedElection={setSelectedCompletedElection}
              setShowResultsModal={setShowResultsModal}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showVotingModal && selectedElection && (
        <VotingModal
          election={selectedElection}
          onClose={() => {
            setShowVotingModal(false);
            setSelectedElection(null);
          }}
          onVote={castVote}
          loading={votingInProgress}
        />
      )}

      {showResultsModal && selectedCompletedElection && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="max-w-3xl w-full p-6">
            <PublicElectionResults
              electionId={selectedCompletedElection.electionID}
              onClose={() => {
                setShowResultsModal(false);
                setSelectedCompletedElection(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingDashboard;