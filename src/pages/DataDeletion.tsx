import React from 'react';
import { Link } from 'react-router-dom';

const DataDeletion: React.FC = () => {
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
            Data Deletion Instructions
          </h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 p-6 rounded-r-lg mb-8">
              <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">
                🔒 Completing Your Data Deletion Request
              </h2>
              <p className="text-blue-700 dark:text-blue-300">
                We have received your data deletion request from Facebook and are processing it. 
                This page provides instructions for completing your data removal.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                What Happens Next?
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="bg-green-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
                    ✅ Immediate Actions (Within 24 hours):
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-green-700 dark:text-green-300">
                    <li>Your request has been logged with confirmation code</li>
                    <li>Account marked for deletion in our systems</li>
                    <li>Data export initiated if requested</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    ⏳ Processing Phase (Within 30 days):
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-700 dark:text-yellow-300">
                    <li>All notes and content permanently deleted</li>
                    <li>User profile and preferences removed</li>
                    <li>Authentication data cleared</li>
                    <li>Cloud sync data purged</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-orange-800 dark:text-orange-200 mb-2">
                    📧 Completion Notification:
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-orange-700 dark:text-orange-300">
                    <li>Email confirmation of deletion completion</li>
                    <li className="text-red-600 dark:text-red-400">This role is permanent and cannot be undone</li>
                    <li>Any backups will also be deleted</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data That Will Be Deleted
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Personal Information:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Account profile and authentication details</li>
                    <li>Email addresses and contact information</li>
                    <li>Profile photos and display names</li>
                    <li>Login credentials and OAuth tokens</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">User Content:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All notes and documents created</li>
                    <li>Tags, categories, and organizational data</li>
                    <li>Note positioning and layout data</li>
                    <li>Task lists and completion status</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Usage Data:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>App preferences and settings</li>
                    <li>Usage analytics and behavior data</li>
                    <li>Device information and sync data</li>
                    <li>Session logs and authentication records</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Important Notes
              </h2>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                    ⚠️ Permanent Deletion
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    Once deleted, your data cannot be recovered. Make sure you have exported 
                    any important notes before proceeding.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    📱 Multi-Device Impact
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Data deleted from our servers will be removed from all your devices 
                    during the next sync. Your local notes will remain until manually cleared.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                    🤝 Shared Content
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    Notes you've shared or collaborated on will remain accessible to other users. 
                    Your personal copy will be deleted.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Need Help or Have Questions?
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Contact Our Privacy Team:</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Email:</strong> 
                      <a href="mailto:privacy@draggynotes.com" className="text-blue-600 hover:underline ml-2">
                        privacy@draggynotes.com
                      </a>
                    </p>
                    <p>
                      <strong>Subject Line:</strong> "Data Deletion Inquiry - Facebook Request"
                    </p>
                    <p>
                      <strong>Response Time:</strong> Within 48 hours
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">What to Include in Your Email:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Confirmation code (if provided by Facebook)</li>
                    <li>Your email address used for the account</li>
                    <li>Any specific concerns or questions</li>
                    <li>Preferred method of contact</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Alternative Actions
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>If you change your mind about deleting your data, you can:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Downgrade Account:</strong> Remove premium features but keep basic service
                  </li>
                  <li>
                    <strong>Export Data:</strong> Download all your notes before deletion
                  </li>
                  <li>
                    <strong>Disable Sync:</strong> Stop cloud synchronization but keep local data
                  </li>
                  <li>
                    <strong>Contact Support:</strong> Discuss alternatives to complete deletion
                  </li>
                </ul>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Facebook Platform Compliance
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This data deletion process complies with Facebook's platform policies 
                  and requirements for user data handling. Your request has been properly 
                  logged and will be processed according to our privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
