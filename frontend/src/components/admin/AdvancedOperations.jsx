import { FaExclamationTriangle } from 'react-icons/fa';

function AdvancedOperations({ onInitializeLedger, onInitializeEncryption, isInitializingLedger, loading }) {


  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
        <h2 className="text-xl font-semibold font-quicksand text-gray-900">Advanced Operations</h2>
      </div>
      
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <p className="text-gray-700 mb-4 font-sans text-sm md:text-base">
          Warning: These operations affect the blockchain network and may reset data. 
          Only use these functions in controlled environments or when necessary.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-semibold text-red-800 mb-2">Initialize Ledger</h3>
            <p className="text-sm text-red-700 mb-3 font-quicksand font-medium">
              Resets all blockchain data. This action cannot be undone.
            </p>
            <button
              onClick={onInitializeLedger}
              disabled={isInitializingLedger}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold md:font-bold rounded-lg px-1.5 py-1 md:px-4 md:py-2 transition-colors disabled:bg-gray-400"
            >
              {isInitializingLedger ? 'INITIALIZING...' : 'INITIALIZE LEDGER'}
            </button>
          </div>
          
          <div>
            <h3 className="text-md font-semibold text-blue-800 mb-2">Initialize Encryption System</h3>
            <p className="text-sm text-blue-700 mb-3 font-quicksand font-medium">
              Sets up encryption for secure voting.
            </p>
            
            
            <button
              onClick={onInitializeEncryption}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold md:font-bold rounded-lg px-1.5 py-1 md:px-4 md:py-2 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'INITIALIZING...' : 'INITIALIZE ENCRYPTION SYSTEM'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 italic mt-2">
        Note: Administrative operations are logged and cannot be modified. Use with caution.
      </div>
    </div>
  );
}

export default AdvancedOperations;