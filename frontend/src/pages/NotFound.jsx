import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-civic-bg gap-4">
      <h1 className="text-6xl font-bold text-civic-blue">404</h1>
      <p className="text-gray-500 text-lg">Page not found</p>
      <Link
        to="/"
        className="mt-4 px-6 py-2.5 bg-civic-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
