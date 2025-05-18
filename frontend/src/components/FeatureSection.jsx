import { motion } from 'framer-motion';
import { FaShieldAlt, FaChartPie, FaLock, FaUserCheck } from 'react-icons/fa';

const features = [
  {
    icon: <FaShieldAlt size={24} />,
    title: 'Secure Voting',
    description: 'End-to-end encryption ensures your vote remains confidential and tamper-proof.'
  },
  {
    icon: <FaChartPie size={24} />,
    title: 'Verifiable Results',
    description: 'Access comprehensive election results once voting has concluded, with transparent and cryptographically verified counting.'
  },
  {
    icon: <FaLock size={24} />,
    title: 'Immutable Records',
    description: 'Blockchain technology ensures votes cannot be altered once cast.'
  },
  {
    icon: <FaUserCheck size={24} />,
    title: 'Voter Verification',
    description: 'Advanced identity verification prevents fraud while maintaining privacy.'
  }
];

function FeatureSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose BlockVote?</h2>
          <p className="text-lg text-gray-600 w-11/12 md:max-w-2xl mx-auto text-center">
            Our blockchain-based voting platform offers unmatched security, transparency and efficiency.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm h-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 flex-grow">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;