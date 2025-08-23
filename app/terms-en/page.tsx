"use client";

import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

export default function EnglishTermsPage() {
  const { currentLang } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div
        className="container mx-auto px-4 py-8 max-w-4xl"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        }}
      >
        <div
          dir="ltr"
          style={{
            textAlign: "left",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.8",
          }}
        >
          <h2 className="text-2xl font-bold mb-4">
            Terms and Conditions of Use for True Chance Platform
          </h2>
          <p className="mb-4">
            <strong>Platform Owner:</strong> Mr. Ahmed Ali Hussain Alghamdi
            <br />
            <strong>Freelance License No.:</strong> FL-631564611
            <br />
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <p className="mb-6">
            Please read these Terms and Conditions carefully before using any
            services offered by the True Chance platform. By accessing or using
            the platform, you agree to be legally bound by all the provisions
            below. This document constitutes a final, binding legal agreement
            between the user and the True Chance platform.
          </p>

          <hr className="my-6 border-zinc-700" />

          <h3 className="text-xl font-semibold mb-3">1. Definitions</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              <strong>Platform:</strong> Refers to the website and digital
              services operating under the name "True Chance," fully and
              exclusively owned by Mr. Ahmed Ali Hussain Alghamdi.
            </li>
            <li>
              <strong>User:</strong> Any individual who uses the platform in any
              capacity, including browsing, uploading a CV, participating in
              interviews, or subscribing to any offered service.
            </li>
            <li>
              <strong>Service:</strong> All current and future features and
              offerings, including interview tools, CV analysis, file creation,
              recommendation activation, and other technical or professional
              services.
            </li>
            <li>
              <strong>Service Fee:</strong> A one-time payment made by the user
              in exchange for access to the platform's core services. This fee
              is non-refundable under all circumstances.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            2. Subscription and Nature of the Service
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              Access to the core services requires the payment of a nominal
              one-time service fee.
            </li>
            <li>
              This fee is strictly non-refundable, as it covers data processing,
              file analysis, and activation of the recommendation engine.
            </li>
            <li>
              While the platform offers professional tools and recommendation
              features, it makes no guarantees of job placement or specific
              outcomes.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            3. Nature of Relationship and Limitation of Liability
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              Use of the platform does not constitute an employment contract or
              promise of hiring.
            </li>
            <li>
              The platform makes a professional effort to analyze and promote
              user profiles based on defined standards, but it cannot guarantee
              contact with, or selection by, any third-party entity.
            </li>
            <li>
              The platform, its owner, representatives, or affiliates shall bear
              no liability for any claims—legal, financial, or otherwise—that
              exceed the amount paid by the user.
            </li>
            <li>
              The user shall not be entitled to any compensation, whether
              material or moral, for outcomes such as lack of recommendations,
              delays, or non-responsiveness from third parties.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            4. Privacy and Use of Data
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              The user agrees that all submitted data will be treated
              confidentially within the scope of legitimate internal use.
            </li>
            <li>
              The platform reserves the right to use submitted data (including
              CVs, interview answers, evaluations, and text or audio recordings)
              for the following purposes:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Service enhancement and development</li>
                <li>Internal research</li>
                <li>Improvement of recommendation and evaluation tools</li>
                <li>
                  Presenting user profiles to interested entities within
                  professional boundaries
                </li>
              </ul>
            </li>
            <li>
              Users are fully responsible for any sensitive or personal
              information they voluntarily submit and accept any consequences
              resulting from that disclosure.
            </li>
            <li>
              <del>
                This clause has been intentionally removed at the request of the
                platform owner
              </del>
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            5. User Conduct and Acceptable Use
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              Users must use the platform lawfully, ethically, and honestly.
              Submitting false, misleading, or infringing content is strictly
              prohibited.
            </li>
            <li>
              The platform reserves the right to suspend or revoke a user's
              access for any violation of these terms, without prior notice or
              compensation.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6. Future Services</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              The platform may offer additional optional services (e.g., career
              consultations, benchmarking, interview preparation, etc.) in the
              future, each subject to its own terms and pricing.
            </li>
            <li>
              Subscribing to such services is entirely optional and governed by
              terms presented at the time of registration.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            7. Intellectual Property
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              All intellectual property rights, software, systems, databases,
              and content related to the True Chance platform are the sole
              property of Mr. Ahmed Ali Hussain Alghamdi and protected under
              Freelance License No. FL-631564611.
            </li>
            <li>
              Any reproduction, reuse, redistribution, or publication of any
              platform content without prior written consent is strictly
              prohibited.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">8. Legal Jurisdiction</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              These terms and all related matters are governed by the laws of
              the Kingdom of Saudi Arabia.
            </li>
            <li>
              Exclusive jurisdiction for resolving any disputes shall lie with
              the courts of Riyadh.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">9. Amendments</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              The platform reserves the right to amend or update these terms at
              any time without prior notice. Continued use of the platform
              constitutes acceptance of the latest version.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">10. General Provisions</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              These Terms and Conditions represent the complete and final
              agreement between the platform and the user, superseding all prior
              agreements or understandings.
            </li>
            <li>
              If any provision of these terms is deemed invalid by a court of
              law, the remaining provisions shall remain fully enforceable.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
