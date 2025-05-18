import { FaGithub, FaCode } from 'react-icons/fa';

function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white pt-10 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">
              BlockVote              
            </h3>
            <p className="text-gray-400 mb-4 max-w-md">
              A secure, transparent, and decentralized voting platform built on blockchain technology.
              A college project focused on applying modern cryptography to electoral systems.
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com/Bhagat-Singh-Kankarwal/BlockVote" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub repository">
                <FaGithub className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Project Team</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">
                <span className="block">Bhagat Singh Kankarwal</span>
                <span className="text-xs text-gray-500">Backend & Blockchain</span>
              </li>
              <li className="text-gray-400">
                <span className="block">Devanshu Tiwari</span>
                <span className="text-xs text-gray-500">Frontend & UX Design</span>
              </li>
              <li className="text-gray-400 mt-3 text-sm">
                <span>Project Supervisor: Dr. Simran Choudhary</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Technologies</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center text-gray-400">
                <FaCode className="h-3 w-3 mr-2" />
                <span className="text-sm">Hyperledger Fabric</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaCode className="h-3 w-3 mr-2" />
                <span className="text-sm">React.js</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaCode className="h-3 w-3 mr-2" />
                <span className="text-sm">Node.js</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaCode className="h-3 w-3 mr-2" />
                <span className="text-sm">Tailwind CSS</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaCode className="h-3 w-3 mr-2" />
                <span className="text-sm">Homomorphic Encryption</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaCode className="h-3 w-3 mr-2" />
                <span className="text-sm">Zero-Knowledge Proofs</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>
            &copy; {year} BlockVote - Blockchain Voting System. <br /> Major Project submission for the
            <span className="font-medium"> Department of Computer Science</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            This project is for educational purposes only. Not intended for use in actual elections without further development and security auditing.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
