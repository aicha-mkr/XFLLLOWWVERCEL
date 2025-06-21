import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-6xl font-bold tracking-tighter">
          Welcome to <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">XFLOW</span>
        </h1>
        <p className="mb-8 text-xl text-gray-300">
          Your complete solution for inventory management, customer relations, and billing
        </p>
        
        <div className="mt-12 space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-600 hover:shadow-xl"
          >
            Test Application
          </button>
        </div>
      </div>
      
      <footer className="mt-16 w-full bg-gray-900 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} XFLOW. All rights reserved.
      </footer>
    </div>
  );
} 