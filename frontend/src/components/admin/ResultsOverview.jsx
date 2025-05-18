import { motion } from 'framer-motion';
import { FaChartPie, FaInfoCircle, FaUsers, FaCalendarAlt } from 'react-icons/fa';

function ResultsOverview({ election, results, count, onBack }) {
  // Calculate total votes
  const totalVotes = count?.totalVotes || count?.voteCount || 0;
  
  // Colors for the pie chart segments
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  // Find candidates with highest votes (could be multiple in case of tie)
  let maxVotes = 0;
  let tiedCandidates = [];
  
  if (results && Array.isArray(results)) {
    // First, determine the maximum vote count
    results.forEach(result => {
      const voteCount = result.count || result.voteCount || 0;
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
      }
    });
    
    // Then find all candidates with that max vote count
    tiedCandidates = results.filter(result => {
      const voteCount = result.count || result.voteCount || 0;
      return voteCount === maxVotes;
    });
  }
  
  // Determine if there's a tie or a clear winner
  const isTie = tiedCandidates.length > 1;
  const winningCandidate = tiedCandidates.length === 1 ? tiedCandidates[0] : null;

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      {election && (
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Winner Card */}
        <div className={`bg-gradient-to-br ${isTie ? 
          'from-white to-yellow-50 border-yellow-100' : 
          'from-white to-green-50 border-green-100'} 
          p-6 rounded-xl border shadow-sm`}>
          <h4 className="text-lg font-bold text-gray-800 mb-4">Election Winner</h4>
          
          {totalVotes > 0 ? (
            <div className="text-center">
              <div className={`inline-flex items-center justify-center ${
                isTie ? 'bg-yellow-100' : 'bg-green-100'
              } h-20 w-20 rounded-full mb-3`}>
                {isTie ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {isTie ? (
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tie between multiple candidates</h3>
              ) : (
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {winningCandidate?.candidateName || winningCandidate?.name || 'Unknown'}
                </h3>
              )}
              {winningCandidate && (
                <p className={`${isTie ? 'text-yellow-700' : 'text-green-700'} font-medium`}>
                  {maxVotes} votes ({Math.round((maxVotes / totalVotes) * 100)}%)
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No votes have been cast in this election</p>
            </div>
          )}
        </div>

        {/* Pie Chart Visualization */}
        <div className='hidden md:block'>
          <h4 className="font-semibold text-gray-800 mb-4">Vote Distribution</h4>
          <div className="flex items-center justify-center h-48 mb-4">
            <div className="relative h-40 w-40">
              {totalVotes > 0 ? (
                <>
                  {/* Create SVG pie chart */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {results.map((result, index) => {
                      const voteCount = result.count || result.voteCount || 0;
                      const percentage = voteCount / totalVotes;
                      
                      // Calculate the angle for the slice
                      const startAngle = results.slice(0, index).reduce((sum, r) => {
                        return sum + ((r.count || r.voteCount || 0) / totalVotes) * 360;
                      }, 0);
                      
                      const endAngle = startAngle + (percentage * 360);
                      
                      // Convert angles to radians
                      const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                      const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                      
                      // Calculate the SVG path
                      const largeArcFlag = percentage > 0.5 ? 1 : 0;
                      
                      // Calculate points on the circle for start and end
                      const x1 = 50 + 38 * Math.cos(startAngleRad);
                      const y1 = 50 + 38 * Math.sin(startAngleRad);
                      const x2 = 50 + 38 * Math.cos(endAngleRad);
                      const y2 = 50 + 38 * Math.sin(endAngleRad);
                      
                      // Create path for the slice
                      const pathData = percentage === 1 ? 
                        `M 50,50 L ${x1},${y1} A 38,38 0 1,1 ${x1-0.001},${y1} Z` :
                        `M 50,50 L ${x1},${y1} A 38,38 0 ${largeArcFlag},1 ${x2},${y2} Z`;
                      
                      return (
                        <path
                          key={result.candidateID || index}
                          d={pathData}
                          fill={colors[index % colors.length]}
                          stroke="#fff"
                          strokeWidth="1"
                        />
                      );
                    })}
                    {/* Center white circle */}
                    <circle cx="50" cy="50" r="25" fill="white" />
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{totalVotes}</p>
                      <p className="text-xs text-gray-500">Total Votes</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full w-full rounded-full border-8 border-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">0</p>
                    <p className="text-xs text-gray-500">Total Votes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Legend */}
          {totalVotes > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {results.map((result, index) => (
                <div key={`legend-${result.candidateID || index}`} className="flex items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-gray-700">{result.candidateName || result.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <h4 className="font-semibold text-gray-800 mb-4">Final Results</h4>
      <div className="space-y-4 mb-8">
        {results && results.length > 0 ? results.map((result, index) => {
          // Support both naming conventions
          const candidateName = result.candidateName || result.name || `Candidate ${result.candidateID}`;
          const voteCount = result.count || result.voteCount || 0;
          const isTiedCandidate = voteCount === maxVotes && isTie;
          
          return (
            <div key={index} className={`bg-gray-50 p-4 rounded-lg border ${isTiedCandidate ? 'border-yellow-300' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="font-medium text-gray-800">{candidateName}</span>
                  {isTiedCandidate && <span className="ml-2 text-yellow-600 text-xs">(Tied for 1st)</span>}
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 h-3 rounded-full">
                <div 
                  className="h-3 rounded-full" 
                  style={{ 
                    width: totalVotes > 0 ? `${(voteCount / totalVotes) * 100}%` : '0%',
                    backgroundColor: isTiedCandidate ? colors[index % colors.length] : colors[index % colors.length]
                  }}
                ></div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 text-right">{voteCount} votes</p>
            </div>
          );
        }) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No results data available</p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-start">
          <FaInfoCircle className="text-primary-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Blockchain Verification</h4>
            <p className="text-sm text-gray-600">
              All votes are securely stored on the blockchain and can be independently verified.
              The results are tamper-proof and transparent.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ResultsOverview;