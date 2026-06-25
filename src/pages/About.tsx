import { BookOpen, Users, Award, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">About BookHaven</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your premier destination for digital books. We're passionate about making reading accessible, 
            enjoyable, and convenient for everyone.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              At BookHaven, we believe that books have the power to transform lives. Our mission is to 
              provide readers worldwide with instant access to thousands of titles across every genre, 
              making the joy of reading available to everyone, everywhere.
            </p>
            <p className="text-gray-700">
              We're committed to supporting authors, publishers, and readers by creating a platform 
              that celebrates literature and fosters a vibrant reading community.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2020, BookHaven started with a simple idea: make quality books accessible 
              to readers in the digital age. What began as a small collection has grown into a 
              comprehensive library with thousands of titles.
            </p>
            <p className="text-gray-700">
              Today, we serve readers in over 50 countries, partnering with major publishers and 
              independent authors to bring you the best in digital literature.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">10,000+ Books</h3>
            <p className="text-sm text-gray-600">
              Extensive collection across all genres
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">500K+ Readers</h3>
            <p className="text-sm text-gray-600">
              Growing community of book lovers
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Award Winning</h3>
            <p className="text-sm text-gray-600">
              Recognized for excellence in digital publishing
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">50+ Countries</h3>
            <p className="text-sm text-gray-600">
              Serving readers worldwide
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white/80 rounded-lg p-8 mb-16 border border-orange-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Accessibility</h3>
              <p className="text-gray-700">
                We believe everyone should have access to quality literature, regardless of location or circumstance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Quality</h3>
              <p className="text-gray-700">
                We carefully curate our collection to ensure readers have access to the best books available.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Community</h3>
              <p className="text-gray-700">
                We foster a vibrant community where readers can discover, discuss, and share their love of books.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Join Our Reading Community</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Start your reading journey today with thousands of books at your fingertips.
          </p>
          <Link to="/books">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 py-6">
              Browse Our Collection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};