import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
