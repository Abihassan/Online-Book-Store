import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 border-t-2 border-orange-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                BookHaven
              </span>
            </Link>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your premier destination for digital books. Discover, read, and enjoy thousands of titles across every genre.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-600 hover:text-orange-600 smooth-transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 smooth-transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 smooth-transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 smooth-transition">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/books" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  All Books
                </Link>
              </li>
              <li>
                <Link to="/books?category=fiction" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  Fiction
                </Link>
              </li>
              <li>
                <Link to="/books?category=non-fiction" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  Non-Fiction
                </Link>
              </li>
              <li>
                <Link to="/books?category=bestsellers" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link to="/books?category=new-releases" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  New Releases
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  Careers
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-orange-600 smooth-transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-700 mb-4">
              Subscribe to get special offers and updates.
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-white/60 border-orange-200 text-gray-800 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-300"
              />
              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                Subscribe
              </Button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-600" />
                <span>support@bookhaven.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-600" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-orange-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-700">
            <p>&copy; {new Date().getFullYear()} BookHaven. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-orange-600 smooth-transition">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-orange-600 smooth-transition">Terms of Service</Link>
              <a href="#" className="hover:text-orange-600 smooth-transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};