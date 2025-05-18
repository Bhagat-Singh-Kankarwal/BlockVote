import { FaNetworkWired, FaSync, FaLock } from 'react-icons/fa';

function AdminStatus({ status, onRefresh, onEnroll }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full">
      <div className="flex items-center mb-6">
        <FaNetworkWired className="text-secondary-600 text-xl mr-3" />
        <h2 className="text-2xl font-semibold font-quicksand text-gray-900">Admin Status</h2>
      </div>
      
      <div className="mb-4 flex items-center">
        <div className={`h-3 w-3 rounded-full mr-2 ${status?.status === 'enrolled' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`font-medium ${status?.status === 'enrolled' ? 'text-green-700' : 'text-red-700'}`}>
          {status?.status === 'enrolled' ? 'Enrolled with Fabric' : 'Not Enrolled'}
        </span>
      </div>
      
      <div className="space-y-4 font-sans">
        <div className="pb-0">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Network</h3>
          <p className="text-gray-900 font-medium">BlockVote Hyperledger Fabric</p>
        </div>
        
        {status?.status === 'enrolled' && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button 
              onClick={onRefresh}
              className="w-full bg-secondary-50 hover:bg-secondary-100 text-secondary-700 font-medium rounded-lg px-4 py-2 transition-colors flex items-center justify-center"
            >
              <FaSync className="mr-2" size={14} />
              Refresh Elections
            </button>
          </div>
        )}

        {status?.status === 'not_enrolled' && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onEnroll}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-4 py-2 transition-colors flex items-center justify-center"
            >
              <FaLock className="mr-2" />
              Enroll Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStatus;