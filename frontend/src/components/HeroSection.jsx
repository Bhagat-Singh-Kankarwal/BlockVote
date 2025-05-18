import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from './Button';
import { FaUserShield, FaUser, FaClipboardList, FaVoteYea } from 'react-icons/fa';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

function HeroSection() {
  const sessionContext = useSessionContext();
  const isUserLoggedIn = sessionContext.loading === false && sessionContext.doesSessionExist;
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check if user has admin token when component mounts or login state changes
  useEffect(() => {
    // Simple check for admin token in localStorage
    const adminToken = localStorage.getItem('adminToken');
    setIsAdminLoggedIn(!!adminToken);
  }, [isUserLoggedIn]);

  return (
    <section className="relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center">

          <div className="w-11/12 lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Secure and Transparent Blockchain Voting
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Experience the future of democracy with our cutting-edge blockchain voting platform.
                Secure, transparent, and accessible from anywhere.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {/* SCENARIO 1: No one logged in - show both options */}
                {!isUserLoggedIn && !isAdminLoggedIn && (
                  <>
                    <Link to="/auth">
                      <Button icon={<FaUser />} size="lg">
                        Enter as Voter
                      </Button>
                    </Link>
                    <Link to="/admin">
                      <Button variant="outline" icon={<FaUserShield />} size="lg">
                        Admin Access
                      </Button>
                    </Link>
                  </>
                )}

                {/* SCENARIO 2: User logged in - only show voting dashboard button */}
                {isUserLoggedIn && !isAdminLoggedIn && (
                  <Link to="/dashboard">
                    <Button icon={<FaVoteYea />} size="lg">
                      Go to Voting Dashboard
                    </Button>
                  </Link>
                )}

                {/* SCENARIO 3: Admin logged in - only show admin dashboard button */}
                {isAdminLoggedIn && (
                  <Link to="/admin/dashboard">
                    <Button icon={<FaClipboardList />} size="lg">
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <motion.div 
                className="animate-float bg-white rounded-2xl shadow-card px-1 py-2 md:p-6 border border-gray-100 overflow-hidden"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              >
                <div className="relative z-10 p-3">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-primary-700">Current Election</h3>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">City Council Vote</h4>
                      <p className="text-sm text-gray-500">Ends in 5 hrs.</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <div className="flex items-center mb-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary-500 bg-primary-200 mr-2"></div>
                        <span className="text-gray-800">Candidate A</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div className="bg-primary-500 h-2 rounded-full w-2/3"></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <div className="flex items-center mb-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2"></div>
                        <span className="text-gray-800">Candidate B</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div className="bg-primary-500 h-2 rounded-full w-1/3"></div>
                      </div>
                    </div>

                  </div>
                  <div className="mt-6 flex justify-between">
                    {isUserLoggedIn ? (
                      <Link to="/dashboard">
                        <button 
                          className="bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium rounded px-4 py-2 transition-colors"
                        >
                          Vote Now
                        </button>
                      </Link>
                    ) : isAdminLoggedIn ? (
                      <Link to="/admin/dashboard">
                        <button 
                          className="bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium rounded px-4 py-2 transition-colors"
                        >
                          Manage Election
                        </button>
                      </Link>
                    ) : (
                      <Link to="/auth">
                        <button 
                          className="bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium rounded px-4 py-2 transition-colors"
                        >
                          Login to Vote
                        </button>
                      </Link>
                    )}
                    
                    <button className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-medium rounded px-4 py-2 transition-colors">
                      Details
                    </button>
                  </div>
                  <div className='mt-4'>
                    <p className="text-xs text-gray-500 mt-2">
                      * This is a demo election. Actual voting may vary.
                    </p>
                  </div>
                </div>
                <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 w-32 h-32 bg-accent-100 rounded-full opacity-40"></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
