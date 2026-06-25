import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'The Rise of Digital Reading: Trends in 2025',
      excerpt: 'Explore how digital reading habits have evolved and what the future holds for e-books and audiobooks.',
      author: 'Sarah Johnson',
      date: '2025-11-10',
      category: 'Industry Insights',
      image: 'https://images.pexels.com/photos/4866041/pexels-photo-4866041.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 2,
      title: 'Top 10 Must-Read Books This Month',
      excerpt: 'Our curated list of the most compelling reads across fiction, non-fiction, and everything in between.',
      author: 'Michael Chen',
      date: '2025-11-08',
      category: 'Book Recommendations',
      image: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 3,
      title: 'How to Build a Better Reading Habit',
      excerpt: 'Practical tips and strategies to help you read more consistently and get the most out of your books.',
      author: 'Emma Williams',
      date: '2025-11-05',
      category: 'Reading Tips',
      image: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 4,
      title: 'Interview with Bestselling Author Jane Doe',
      excerpt: 'An exclusive conversation about her latest novel, writing process, and advice for aspiring authors.',
      author: 'David Martinez',
      date: '2025-11-03',
      category: 'Author Interviews',
      image: 'https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 5,
      title: 'The Benefits of Reading Before Bed',
      excerpt: 'Scientific research shows how reading can improve sleep quality and overall well-being.',
      author: 'Dr. Lisa Anderson',
      date: '2025-11-01',
      category: 'Health & Wellness',
      image: 'https://images.pexels.com/photos/1231622/pexels-photo-1231622.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 6,
      title: 'BookHaven Community Spotlight: Reader Stories',
      excerpt: 'Hear from our community members about how books have transformed their lives.',
      author: 'Community Team',
      date: '2025-10-28',
      category: 'Community',
      image: 'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">BookHaven Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover book recommendations, reading tips, author interviews, and insights into 
            the world of digital reading.
          </p>
        </div>

        {/* Featured Post */}
        <Card className="mb-12 border-orange-200 bg-white/80 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="aspect-video md:aspect-auto">
              <img
                src={blogPosts[0].image}
                alt={blogPosts[0].title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-8 flex flex-col justify-center">
              <div className="text-sm text-orange-600 font-semibold mb-2">
                FEATURED POST
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {blogPosts[0].title}
              </h2>
              <p className="text-gray-700 mb-4">{blogPosts[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {blogPosts[0].author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(blogPosts[0].date).toLocaleDateString()}
                </span>
              </div>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white w-fit">
                Read More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        </Card>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.slice(1).map((post) => (
            <Card
              key={post.id}
              className="border-orange-200 bg-white/80 overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6">
                <div className="text-xs text-orange-600 font-semibold mb-2">
                  {post.category}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                </div>
                <Link to={`/blog/${post.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Read More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Get the latest book recommendations, reading tips, and exclusive content delivered 
            to your inbox every week.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800"
            />
            <Button className="bg-white text-orange-600 hover:bg-gray-100 px-8">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};