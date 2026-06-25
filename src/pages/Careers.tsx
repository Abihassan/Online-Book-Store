import { Briefcase, Heart, Zap, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const Careers = () => {
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Content Acquisition Manager',
      department: 'Content',
      location: 'New York, NY',
      type: 'Full-time',
    },
    {
      title: 'Customer Success Specialist',
      department: 'Support',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'San Francisco, CA',
      type: 'Full-time',
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance and wellness programs',
    },
    {
      icon: Zap,
      title: 'Growth & Learning',
      description: 'Professional development budget and learning opportunities',
    },
    {
      icon: Users,
      title: 'Work-Life Balance',
      description: 'Flexible hours and generous PTO policy',
    },
    {
      icon: Briefcase,
      title: 'Remote First',
      description: 'Work from anywhere with our remote-first culture',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us build the future of digital reading. We're looking for passionate individuals 
            who love books and technology.
          </p>
        </div>

        {/* Why Join Us */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why BookHaven?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-orange-200 bg-white/80">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Open Positions</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="border-orange-200 bg-white/80 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{position.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {position.department}
                        </span>
                        <span>•</span>
                        <span>{position.location}</span>
                        <span>•</span>
                        <span>{position.type}</span>
                      </div>
                    </div>
                    <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white whitespace-nowrap">
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Culture Section */}
        <div className="bg-white/80 rounded-lg p-8 mb-16 border border-orange-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Culture</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Innovation</h3>
              <p className="text-gray-700">
                We encourage creative thinking and embrace new ideas. Your voice matters here.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Collaboration</h3>
              <p className="text-gray-700">
                We work together as one team, supporting each other to achieve our goals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Impact</h3>
              <p className="text-gray-700">
                Your work directly impacts millions of readers worldwide. Make a difference.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Don't See a Perfect Fit?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're always looking for talented individuals. Send us your resume and tell us why 
            you'd be a great addition to the BookHaven team.
          </p>
          <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 py-6">
            Send General Application
          </Button>
        </div>
      </div>
    </div>
  );
};