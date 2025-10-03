import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Draggy Notes
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Email address and authentication credentials</li>
                    <li>Profile information (name, avatar) from OAuth providers (Google, Facebook, Apple)</li>
                    <li>Notes content and metadata you create</li>
                    <li>Usage analytics and app preferences</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Technical Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Device information and browser type</li>
                    <li>IP address and location data (for performance)</li>
                    <li>App crash reports and performance metrics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. How We Use Your Information
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and improve our note-taking services</li>
                  <li>Synchronize your notes across devices</li>
                  <li>Authenticate your identity securely</li>
                  <li>Send push notifications for app updates</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Ensure app security and prevent abuse</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Data Storage and Security
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  Your data is stored securely using industry-standard encryption. We use:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>End-to-end encryption for your notes</li>
                  <li>Secure cloud storage with Firebase</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Data Sharing
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We do not sell or share your personal data with third parties except:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers who help us operate our app</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Your Rights
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Update or correct your information</li>
                  <li>Delete your account and data</li>
                  <li>Export your notes and data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
                <p>
                  To exercise these rights, contact us at: 
                  <a href="mailto:privacy@draggynotes.com" className="text-blue-600 hover:underline">
                    privacy@draggynotes.com
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Cookies and Tracking
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Remember your preferences</li>
                  <li>Keep you logged in</li>
                  <li>Analyze app performance</li>
                  <li>Provide personalized experiences</li>
                </ul>
                <p>You can control cookie settings in your browser.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Children's Privacy
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  Our app is not directed to children under 13. We do not knowingly 
                  collect personal information from children. If you believe we have 
                  inadvertently collected such information, please contact us immediately.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Changes to This Policy
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  We may update this Privacy Policy from time to time. We will notify 
                  you of significant changes by email or through our app. Your continued 
                  use after changes constitutes acceptance.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Contact Information
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  If you have questions about this Privacy Policy, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong> privacy@draggynotes.com<br />
                    <strong>Address:</strong> [Your Business Address]<br />
                    <strong>Phone:</strong> [Your Phone Number]
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
