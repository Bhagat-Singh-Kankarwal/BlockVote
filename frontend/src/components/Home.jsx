import { useEffect } from 'react';
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import { motion } from 'framer-motion';
import { FaCheck, FaFingerprint, FaLockOpen, FaVoteYea } from 'react-icons/fa';

function Home() {

  return (
    <div>
      <HeroSection />
      <FeatureSection />

      {/* How it works section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How BlockVote Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our platform makes voting secure and simple through blockchain technology.
              </p>
            </motion.div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>

              {/* Steps */}
              <div className="space-y-6 md:space-y-10">
                {[
                  {
                    icon: <FaFingerprint />,
                    title: 'Voter Registration',
                    description: 'Create an account with secure identity verification to ensure one person, one vote.'
                  },
                  {
                    icon: <FaLockOpen />,
                    title: 'Access Ballot',
                    description: 'Securely log in to access active elections you\'re eligible to participate in.'
                  },
                  {
                    icon: <FaVoteYea />,
                    title: 'Cast Your Vote',
                    description: 'Vote privately with end-to-end encryption ensuring complete confidentiality.'
                  },
                  {
                    icon: <FaCheck />,
                    title: 'Verification',
                    description: 'Verify your vote was recorded correctly without revealing your choice.'
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className='px-2 md:px-0 md:grid md:grid-cols-7 w-full'>

                      <div className={`col-span-3 hidden md:block ${index % 2 === 0 ? "text-right" : ""}`}>
                        {index % 2 === 0 && (
                          <div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                            <p className="text-gray-600">{step.description}</p>
                          </div>
                        )}
                      </div>

                      <div className='col-span-1 flex justify-center items-center'>
                        <div className={`bg-primary-600 text-white h-12 w-12 rounded-full flex items-center justify-center shadow-md z-10`}>
                          {step.icon}
                        </div>
                      </div>

                      <div className={`col-span-3 hidden md:block ${index % 2 === 1 ? "text-left" : ""}`}>
                        {index % 2 === 1 && (
                          <div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                            <p className="text-gray-600">{step.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Mobile content always displayed below icon */}
                      <div className="md:hidden mt-4 text-center">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-white"
          >
            <h2 className="text-3xl font-bold mb-6">Interested in Our Research?</h2>
            <p className="text-lg opacity-90 mb-8">
              This project is part of our academic exploration into blockchain voting systems. 
              We welcome feedback and collaboration from other researchers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium"
                onClick={() => window.location.href = '/'}
              >
                Get Started Now
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Home;