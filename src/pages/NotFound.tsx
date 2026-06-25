import { Link } from 'react-router-dom';
import { BookOpen, Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/button';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Illustration */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-48 h-48 rounded-full bg-orange-100 flex items-center justify-center">
            <BookOpen className="h-20 w-20 text-orange-300" strokeWidth={1.2} />
          </div>
          {/* 404 badge */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-black px-4 py-2 rounded-2xl shadow-lg rotate-3">
            404
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-3">Page not found</h1>
        <p className="text-gray-500 text-lg mb-2">Looks like this page has gone missing from our shelves.</p>
        <p className="text-gray-400 text-sm mb-10">The page you're looking for doesn't exist or may have been moved.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-5 text-base">
              <Home className="mr-2 h-4 w-4" />Back to Home
            </Button>
          </Link>
          <Link to="/books">
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-5 text-base">
              <Search className="mr-2 h-4 w-4" />Browse Books
            </Button>
          </Link>
        </div>

        <button onClick={() => window.history.back()} className="mt-6 flex items-center gap-1 text-sm text-gray-400 hover:text-orange-500 transition-colors mx-auto">
          <ArrowLeft className="h-4 w-4" />Go back to previous page
        </button>
      </div>
    </div>
  );
};