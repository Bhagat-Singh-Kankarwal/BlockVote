import { useState } from 'react';

const VotingModal = ({ election, onClose, onVote, loading }) => {
  const [selectedCandidate, setSelectedCandidate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      return;
    }
    onVote(election.electionID, selectedCandidate);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 font-quicksand">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{election.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4 font-bold">{election.description}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 font-sans">
            <label className="block text-gray-700 mb-2 font-medium">Select a candidate:</label>
            <div className="space-y-2">

              {election.candidates.map(candidate => (
                <label 
                    key={candidate.candidateID} 
                    className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                >
                    <input 
                    type="radio" 
                    name="candidate" 
                    value={candidate.candidateID}
                    checked={selectedCandidate === candidate.candidateID}
                    onChange={() => setSelectedCandidate(candidate.candidateID)}
                    className="mr-2"
                    disabled={loading}
                    />
                    <span className='font-normal'>
                      {candidate.name || `Candidate ${candidate.candidateID}`}
                    </span>
                </label>
                ))}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 mr-2 font-medium hover:bg-gray-200 transition rounded"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded transition font-medium disabled:opacity-50"
              disabled={!selectedCandidate || loading}
            >
              {loading ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VotingModal;
