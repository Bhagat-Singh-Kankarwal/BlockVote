import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaClock } from 'react-icons/fa';
import { toast } from 'sonner';

function CreateElection({ onSubmit, loading }) {
  const now = new Date();
  const localDatetimeStr = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    electionID: '',
    name: '',
    description: '',
    startDate: '',
    durationHours: 2, // Default to 2 hours
    candidates: [{ candidateID: '1', name: '', party: '' }]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCandidateChange = (index, field, value) => {
    const updatedCandidates = [...formData.candidates];
    updatedCandidates[index][field] = value;
    setFormData({ ...formData, candidates: updatedCandidates });
  };

  const handleAddCandidate = () => {
    const lastId = formData.candidates.length > 0
      ? parseInt(formData.candidates[formData.candidates.length - 1].candidateID)
      : 0;

    setFormData({
      ...formData,
      candidates: [
        ...formData.candidates,
        { candidateID: (lastId + 1).toString(), name: '', party: '' }
      ]
    });
  };

  const handleRemoveCandidate = (index) => {
    if (formData.candidates.length <= 1) return;

    const updatedCandidates = formData.candidates.filter((_, i) => i !== index);
    setFormData({ ...formData, candidates: updatedCandidates });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate start date and duration
    if (!formData.startDate) {
      toast.warning('Please select a start date');
      return;
    }

    const start = new Date(formData.startDate);
    const now = new Date();

    // Check if start date is in the past
    if (start < now) {
      toast.warning('Election start time cannot be in the past');
      return;
    }

    const durationHours = parseInt(formData.durationHours);
    if (isNaN(durationHours) || durationHours < 1) {
      toast.warning('Duration must be at least 1 hour');
      return;
    }

    if (durationHours > 168) { // 7 days max
      toast.warning('Duration cannot exceed 168 hours (7 days)');
      return;
    }

    // Calculate end date based on duration
    const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));

    // Filter out empty candidates
    const validCandidates = formData.candidates.filter(c => c.name.trim() !== '');

    if (validCandidates.length < 2) {
      toast.warning('At least two candidates are required');
      return;
    }

    // Check if all candidates have parties
    const missingParty = validCandidates.some(c => !c.party.trim());
    if (missingParty) {
      toast.warning('All candidates must have a party affiliation');
      return;
    }

    // Format data for blockchain submission
    const formattedData = {
      ...formData,
      // Convert to timestamps as expected by contract
      startDate: start.getTime(),
      endDate: end.getTime(), // Send calculated end date
      candidates: validCandidates
    };

    console.log('Form submitted with data:', formattedData);

    // Submit to blockchain
    onSubmit(formattedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      <h2 className="text-xl font-semibold mb-4 font-sans">Create New Election</h2>

      <form onSubmit={handleSubmit} className="space-y-6 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">Election ID</label>
            <input
              type="text"
              name="electionID"
              value={formData.electionID}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Unique identifier for the election"
            />
            <p className="text-xs text-gray-500 mt-1">Must be unique and will be used as a reference ID</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Election name"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-2 text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="3"
            placeholder="Election description"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">Start Date & Time</label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={localDatetimeStr}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">When the election will begin</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">Duration (Hours)</label>
            <div className="flex items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaClock className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="durationHours"
                  value={formData.durationHours}
                  onChange={handleChange}
                  min="1"
                  max="168"
                  required
                  className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <span className="ml-2 text-gray-700">hours</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">How long the election will run (1-168 hours)</p>
            {formData.startDate && formData.durationHours > 0 && (
              <p className="text-xs font-medium text-secondary-600 mt-2">
                Election will end: {new Date(new Date(formData.startDate).getTime() + (formData.durationHours * 60 * 60 * 1000)).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-gray-700 text-sm font-medium">Candidates</label>
            <button
              type="button"
              onClick={handleAddCandidate}
              className="text-secondary-600 hover:text-secondary-800 flex items-center text-sm font-medium"
            >
              <FaPlus size={12} className="mr-1" />
              Add Candidate
            </button>
          </div>

          <div className="space-y-4 md:bg-gray-50 md:p-4 rounded-lg md:border border-gray-200">
            {formData.candidates.map((candidate, index) => (
              <div key={index} className="flex items-start space-x-4 bg-white p-4 rounded-lg border border-gray-300 md:border-gray-100">
                <div className="flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Candidate Name</label>
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="Candidate Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Party Affiliation</label>
                      <input
                        type="text"
                        value={candidate.party}
                        onChange={(e) => handleCandidateChange(index, 'party', e.target.value)}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="Party Name"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCandidate(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove Candidate"
                  disabled={formData.candidates.length <= 1}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Minimum 2 candidates required with party affiliation</p>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6 flex justify-end space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded px-6 py-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Election'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default CreateElection;