import { motion } from 'framer-motion';
import { FaShieldAlt, FaUpload, FaKey } from 'react-icons/fa';

const IdentitySetup = ({
  isRegisteredButMissingFile,
  handleIdentityFileUpload,
  registerWithFabric,
  loading
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-card p-8 border border-gray-100 max-w-md w-full font-sans"
    >
      <div className="flex items-center mb-6">
        <FaShieldAlt className="text-primary-600 text-2xl mr-3" />
        <h2 className="text-2xl font-semibold text-gray-900 font-quicksand">Blockchain Identity</h2>
      </div>
      
      <div className="bg-primary-50 text-primary-700 p-4 rounded-lg mb-6 border border-primary-100">
        <p className="font-semibold">Secure Identity Required</p>
        <p className="mt-2 text-sm font-medium">
          To participate in secure voting, you need a blockchain identity that ensures your vote is anonymous yet verifiable.
        </p>
      </div>

      {isRegisteredButMissingFile ? (
        <>
          <div className="mb-6">
            <p className="text-gray-700 mb-4 font-medium">
              You're already registered. Upload your identity file:
            </p>
            <label className="block w-full cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleIdentityFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-primary-300 p-6 rounded-lg text-center hover:bg-primary-50 transition-colors">
                <FaUpload className="mx-auto h-8 w-8 text-primary-400 mb-2" />
                <p className="font-medium text-primary-700">Click to upload identity file</p>
                <p className="text-sm text-gray-500 mt-1">(.json format)</p>
              </div>
            </label>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <FaKey className="h-16 w-16 text-primary-200 mb-4" />
          <button
            onClick={registerWithFabric}
            className="w-full font-semibold px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Identity...
              </>
            ) : (
              <>Create Blockchain Identity</>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">
            This creates a secure cryptographic identity that will be saved to your browser and can be downloaded for backup.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default IdentitySetup;