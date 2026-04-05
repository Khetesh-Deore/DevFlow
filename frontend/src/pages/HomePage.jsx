import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl font-bold mb-4">DevFlow</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-xl">
        A competitive programming platform built for college students. Practice problems, compete in contests, and track your progress.
      </p>
      <div className="flex gap-4">
        <Link to="/problems" className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
          Start Solving
        </Link>
        <Link to="/contests" className="bg-gray-800 px-6 py-3 rounded-lg hover:bg-gray-700 font-medium">
          View Contests
        </Link>
      </div>
    </div>
  );
}
