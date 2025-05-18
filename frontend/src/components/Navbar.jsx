import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSessionContext, signOut } from 'supertokens-auth-react/recipe/session';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVoteYea, FaBars, FaTimes } from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();
  const sessionContext = useSessionContext();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  
  // Check if user is logged in with SuperTokens
  const isUserLoggedIn = sessionContext.loading === false && sessionContext.doesSessionExist;
  
  // Check for admin token on component mount and route change
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    setIsAdminLoggedIn(!!adminToken);
  }, [location.pathname]);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuRef]);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleUserLogout = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
    toast.success('Admin logged out successfully');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path
    ? 'text-primary-600 font-medium'
    : 'text-gray-600 hover:text-primary-600';

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3"
            >
              <FaVoteYea className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">BlockVote</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link to="/" className={`${isActive('/')} transition duration-200`}>
              Home
            </Link>
            
            {isUserLoggedIn && !isAdminLoggedIn && (
              <>
                <Link to="/dashboard" className={`${isActive('/dashboard')} transition duration-200`}>
                  Dashboard
                </Link>
                <button 
                  onClick={handleUserLogout}
                  className="btn-outline py-2 px-4"
                >
                  Logout
                </button>
              </>
            )}
            
            {!isUserLoggedIn && !isAdminLoggedIn && (
              <>
                <Link to="/auth" className={`${isActive('/auth')} transition duration-200`}>
                  Login / Register
                </Link>
                <Link 
                  to="/admin" 
                  className="btn-primary py-2 px-4"
                >
                  Admin
                </Link>
              </>
            )}
            
            {isAdminLoggedIn && (
              <>
                <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard')} transition duration-200`}>
                  Admin Dashboard
                </Link>
                <button 
                  onClick={handleAdminLogout}
                  className="btn-outline py-2 px-4"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-white"
          ref={mobileMenuRef}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 font-semibold">
            <Link
              to="/"
              className={`${location.pathname === '/' ? 'bg-gray-100 text-primary-600' : 'text-gray-600'} block px-3 py-2 rounded-md font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {isUserLoggedIn && !isAdminLoggedIn && (
              <>
                <Link
                  to="/dashboard"
                  className={`${location.pathname === '/dashboard' ? 'bg-gray-100 text-primary-600' : 'text-gray-600'} block px-3 py-2 rounded-md font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleUserLogout}
                  className="w-full text-left block px-3 py-2 text-gray-600 rounded-md hover:bg-gray-100 hover:text-primary-600"
                >
                  Logout
                </button>
              </>
            )}

            {!isUserLoggedIn && !isAdminLoggedIn && (
              <>
                <Link
                  to="/auth"
                  className={`${location.pathname === '/auth' ? 'bg-gray-100 text-primary-600' : 'text-gray-600'} block px-3 py-2 rounded-md font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login / Register
                </Link>
                <Link 
                  to="/admin" 
                  className={`${location.pathname === '/admin' ? 'bg-gray-100 text-primary-600' : 'text-gray-600'} block px-3 py-2 rounded-md font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </>
            )}

            {isAdminLoggedIn && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`${location.pathname === '/admin/dashboard' ? 'bg-gray-100 text-primary-600' : 'text-gray-600'} block px-3 py-2 rounded-md font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleAdminLogout}
                  className="w-full text-left block px-3 py-2 text-gray-600 rounded-md hover:bg-gray-100 hover:text-primary-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;