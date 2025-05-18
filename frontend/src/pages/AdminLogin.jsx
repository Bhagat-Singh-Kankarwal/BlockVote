import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../utils/api';
import { useSessionContext, doesSessionExist, signOut } from 'supertokens-auth-react/recipe/session';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const sessionContext = useSessionContext();

  // Check if user is already logged in with SuperTokens
  useEffect(() => {
    const checkUserSession = async () => {
      if (sessionContext.loading === false && sessionContext.doesSessionExist) {
        toast.warning('Please log out from your user account before accessing admin features');
        navigate('/');
      }
    };
    
    checkUserSession();
  }, [sessionContext, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First check if user is logged in with SuperTokens
      if (await doesSessionExist()) {
        // Log out user from SuperTokens before proceeding with admin login
        await signOut();
        toast.info('You have been logged out from your user account');
      }

      const response = await api.post('/fabric/admin/login', { 
        username,
        password
      });
      
      // Store admin token
      localStorage.setItem('adminToken', response.data.token);
      toast.success('Admin login successful');
      
      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login failed:', error);
      let errorMessage = 'Admin login failed';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-84px)] flex items-center justify-center p-4 w-full">
      <div className="bg-white py-8 px-12 rounded-lg shadow-md w-full md:w-1/4">
        <h2 className="text-2xl font-quicksand font-bold mb-6 text-center text-gray-800">
          Admin Login
        </h2>
        
        <hr />

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          <div>
            <label className="block text-gray-700 mb-2 font-bold text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 font-mono text-sm tracking-wide border border-gray-300 focus:border-gray-800 bg-neutral-50 focus:bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-500"
              required
              placeholder="Username"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-bold text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 font-mono text-sm tracking-wide border border-gray-300 focus:border-gray-800 bg-neutral-50 focus:bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-500"
              required
              placeholder="Password"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-black text-white text-sm font-bold py-1.5 px-4 rounded-md transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
          
          <p className="hidden text-xs text-gray-500 text-center mt-2">
            Note: You cannot be logged in as both admin and user simultaneously
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;