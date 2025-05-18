import { motion } from 'framer-motion';
import { FaChartPie } from 'react-icons/fa';

const CompletedElectionCard = ({
  election,
  onViewResults,
  index = 0
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }).format(date);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold font-sans text-gray-800">{election.name}</h3>
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
            {election.status === 'RESULTS_DECLARED' ? 'Results Declared' : 'Ended'}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm font-semibold mb-4 line-clamp-2">{election.description}</p>
        
        <div className="mb-5">
          <p className="text-sm text-gray-500 font-sans mb-2">
            Ended: {formatDate(election.endDate)}
          </p>
        </div>
        
        <button 
          onClick={onViewResults}
          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded px-4 py-2 transition-colors flex items-center justify-center"
        >
          <FaChartPie className="mr-2" />
          View Official Results
        </button>
      </div>
    </motion.div>
  );
};

export default CompletedElectionCard;