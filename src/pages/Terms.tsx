import { FileText } from 'lucide-react';

export const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <FileText className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Terms of Service</h1>
            <p className="text-gray-600">Last updated: November 11, 2025</p>
          </div>

          <div className="bg-white/80 rounded-lg p-8 border border-orange-200 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using BookHaven's services, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Account Registration</h2>
              <p className="text-gray-700 mb-3">
                To access certain features, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Purchases and Payments</h2>
              <p className="text-gray-700 mb-3">
                When you purchase books through our platform:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All prices are in USD unless otherwise stated</li>
                <li>Payment is processed securely through our payment partners</li>
                <li>You receive a license to access the digital content</li>
                <li>Purchases are final and non-refundable except as required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. License and Restrictions</h2>
              <p className="text-gray-700 mb-3">
                We grant you a limited, non-exclusive, non-transferable license to access purchased books. You may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Share your account with others</li>
                <li>Copy, distribute, or sell purchased content</li>
                <li>Remove copyright notices or DRM protection</li>
                <li>Use content for commercial purposes</li>
                <li>Reverse engineer our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">5. User Content</h2>
              <p className="text-gray-700">
                When you post reviews or other content, you grant us a worldwide, non-exclusive license to use, 
                display, and distribute that content. You are responsible for ensuring your content does not 
                violate any laws or third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Prohibited Conduct</h2>
              <p className="text-gray-700 mb-3">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated systems to access our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700">
                All content on BookHaven, including books, logos, and software, is protected by copyright and 
                other intellectual property laws. Our trademarks may not be used without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-gray-700">
                Our services are provided "as is" without warranties of any kind. We do not guarantee that our 
                services will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700">
                To the maximum extent permitted by law, BookHaven shall not be liable for any indirect, incidental, 
                special, or consequential damages arising from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Termination</h2>
              <p className="text-gray-700">
                We may suspend or terminate your account at any time for violations of these terms. Upon termination, 
                your right to access purchased content may be revoked.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of material changes. 
                Your continued use of our services constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, contact us at:
              </p>
              <p className="text-gray-700 mt-2">
                Email: legal@bookhaven.com<br />
                Phone: +1 (555) 123-4567
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};