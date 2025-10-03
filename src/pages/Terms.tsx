import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
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
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  By accessing and using Draggy Notes ("the Service"), you accept and agree 
                  to be bound by the terms and provision of this agreement. If you do not 
                  agree to abide by the above, please do not use this service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Description of Service
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  Draggy Notes is a digital note-taking application that allows users to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create, edit, and organize notes</li>
                  <li>Synchronize notes across multiple devices</li>
                  <li>Collaborate and share notes with others</li>
                  <li>Use tags and categories for organization</li>
                  <li>Access their notes through web and mobile applications</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. User Accounts
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-medium mb-2">Account Creation</h3>
                  <p>
                    You may create an account using email/password or OAuth providers 
                    (Google, Facebook, Apple). You are responsible for maintaining the 
                    confidentiality of your account credentials.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Account Security</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You must notify us immediately of unauthorized use</li>
                    <li>You are liable for all activities under your account</li>
                    <li>We reserve the right to suspend accounts for security violations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Acceptable Use
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>You agree not to use the Service for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Any unlawful purpose or in violation of applicable laws</li>
                  <li>Transmitting harmful, defamatory, or offensive content</li>
                  <li>Attempting to gain unauthorized access to our systems</li>
                  <li>Interfering with or disrupting the Service</li>
                  <li>Creating multiple accounts to circumvent limitations</li>
                  <li>Commercial use without written permission</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Intellectual Property
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-medium mb-2">Your Content</h3>
                  <p>
                    You retain ownership of all notes and content you create. By using 
                    our Service, you grant us a license to store, process, and sync your 
                    content for the purpose of providing our services.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Our Service</h3>
                  <p>
                    The Draggy Notes application, including its design, software, and 
                    documentation, is protected by intellectual property laws and owned 
                    by us or our licensors.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Privacy and Data Protection
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  Your privacy is important to us. Our collection and use of your 
                  information is governed by our Privacy Policy, which is incorporated 
                  into these Terms by reference.
                </p>
                <p>
                  By using the Service, you consent to the collection and use of 
                  information as described in our Privacy Policy.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Service Availability
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  We strive to maintain 99% uptime but cannot guarantee 
                  uninterrupted service. The Service may be temporarily unavailable due to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Scheduled maintenance</li>
                  <li>Technical issues beyond our control</li>
                  <li>Force majeure events</li>
                  <li>System upgrades</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Termination
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-medium mb-2">By You</h3>
                  <p>
                    You may terminate your account at any time by contacting support. 
                    Upon termination, we will delete your data as outlined in our Privacy Policy.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">By Us</h3>
                  <p>
                    We may suspend or terminate your account if you violate these Terms 
                    or for other business reasons with reasonable notice.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Disclaimers and Limitations
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                    ⚠️ Important Notice
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. 
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, 
                    INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
                  </p>
                </div>
                
                <p>
                  We shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages arising from your use of the Service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Changes to Terms
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify 
                  users of material changes via email or app notification. Continued use 
                  after changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Governing Law
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  These Terms are governed by and construed in accordance with the laws 
                  of [Your Jurisdiction]. Any disputes arising from these Terms shall be 
                  subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Contact Information
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong> legal@draggynotes.com<br />
                    <strong>Address:</strong> [Your Business Address]<br />
                    <strong>Phone:</strong> [Your Phone Number]
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By using Draggy Notes, you acknowledge that you have read and understood 
                these Terms of Service and agree to be bound by them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
