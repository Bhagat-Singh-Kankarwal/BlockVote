import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaEnvelope, FaKey } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'sonner';

const OtpVerificationModal = ({ election, onClose, onVerificationComplete }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('loading'); // 'loading' or 'verify'
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const fetchEmailAndRequestOtp = async () => {
      try {
        setIsLoading(true);
        const response = await api.post(`/elections/${election.electionID}/request-otp`);
        
        if (response.data.success) {
          setEmail(response.data.email);
          toast.success('OTP sent to your email');
          setStep('verify');
          setCountdown(response.data.expiresIn || 600);
        }
      } catch (error) {
        console.error('Failed to send OTP:', error);
        toast.error(error.response?.data?.details || 'Failed to send verification code');
        onClose(); // Close the modal on error instead of falling back to manual input
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailAndRequestOtp();
  }, [election.electionID, onClose]);

  useEffect(() => {
    // Handle countdown timer for OTP expiration
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResendOtp = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await api.post(`/elections/${election.electionID}/request-otp`);
      
      if (response.data.success) {
        toast.success('New verification code sent to your email');
        setCountdown(response.data.expiresIn || 600);
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast.error(error.response?.data?.details || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the verification code');
    
    try {
      setIsLoading(true);
      const response = await api.post(`/elections/${election.electionID}/verify-otp`, { otp });
      
      if (response.data.success) {
        toast.success('Email verified successfully');
        onVerificationComplete();
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      toast.error(error.response?.data?.details || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col items-center"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Preparing Verification</h2>
          <div className="animate-spin h-8 w-8 border-4 border-secondary-600 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Sending verification code to your email...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Verify Your Email</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter Verification Code
              </label>
              {countdown > 0 && (
                <span className="text-sm text-gray-500">
                  Expires in {formatTime(countdown)}
                </span>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaKey className="text-gray-400" />
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent tracking-widest text-center font-mono"
                placeholder="123456"
                maxLength="6"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-600">
              {/* <FaEnvelope className="text-gray-400 mr-2" /> */}
              <p className='text-pretty'>
                Check your email <span className="font-medium">{email}</span> for the code.
              </p>
            </div>
            
            {countdown === 0 && (
              <button 
                type="button"
                onClick={handleResendOtp}
                className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                disabled={isLoading}
              >
                Didn't receive it? Send a new code
              </button>
            )}
          </div>

          <div className="flex justify-end items-center pt-2">
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="bg-secondary-600 hover:bg-secondary-700 text-white py-2 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">⏳</span>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OtpVerificationModal;