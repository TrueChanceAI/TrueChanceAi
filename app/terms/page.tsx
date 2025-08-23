"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/upload-resume" 
            className="inline-flex items-center justify-center px-4 py-2 text-sm text-white font-medium rounded-lg cursor-pointer hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200 mb-4"
          >
            ← Back to Upload Resume
          </Link>
          <h1 className="text-3xl font-bold mb-4">
            Terms and Conditions
          </h1>
          <p className="text-zinc-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using TrueChance ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Description of Service
            </h2>
            <p>
              TrueChance is an AI-powered platform that provides mock interview services. The platform uses artificial intelligence to conduct interviews, analyze responses, and provide feedback to help users improve their interview skills.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. User Data and Privacy
            </h2>
            <div className="space-y-3">
              <p>
                <strong>Data Collection:</strong> We collect and process the following information:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email address for account management and communication</li>
                <li>Resume/CV files uploaded for interview preparation</li>
                <li>Interview transcripts and responses</li>
                <li>Audio recordings during interviews (if applicable)</li>
                <li>Feedback and analysis results</li>
              </ul>
              <p>
                <strong>Data Processing:</strong> Your data is processed to provide interview services, generate personalized questions, and deliver feedback. We use AI technologies to analyze your responses and provide insights.
              </p>
              <p>
                <strong>Data Storage:</strong> Your information is stored securely using industry-standard encryption and security measures. We retain your data only as long as necessary to provide our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. User Responsibilities
            </h2>
            <div className="space-y-3">
              <p>By using TrueChance, you agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate and truthful information</li>
                <li>Not upload malicious files or content</li>
                <li>Use the platform for legitimate interview preparation purposes only</li>
                <li>Respect the intellectual property rights of the platform</li>
                <li>Not attempt to reverse engineer or hack the platform</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. AI and Technology
            </h2>
            <p>
              TrueChance utilizes artificial intelligence and machine learning technologies to provide interview services. While we strive for accuracy, AI-generated feedback and analysis should be considered as guidance rather than definitive assessments. Users are encouraged to use their judgment and seek professional advice when appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              TrueChance is provided "as is" without warranties of any kind. We are not responsible for any decisions made based on the platform's feedback or analysis. Users acknowledge that interview outcomes in real-world scenarios may differ from mock interview results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Intellectual Property
            </h2>
            <p>
              All content, features, and functionality of TrueChance are owned by us and are protected by international copyright, trademark, and other intellectual property laws. Users retain ownership of their uploaded content but grant us license to process it for service provision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Termination
            </h2>
            <p>
              We reserve the right to terminate or suspend access to TrueChance at any time, without notice, for conduct that we believe violates these Terms and Conditions or is harmful to other users or the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us through the platform or at our designated support channels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Governing Law
            </h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from the use of TrueChance shall be resolved through appropriate legal channels.
            </p>
          </section>

          <div className="mt-8 p-4 bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-400">
              <strong>Note:</strong> By using TrueChance, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 