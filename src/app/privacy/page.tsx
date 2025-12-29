import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - DeepScholar',
  description: 'Privacy policy for DeepScholar',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Privacy Policy
      </h1>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            1. Information We Collect
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We collect information you provide directly to us when you:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Create an account and set up your profile</li>
            <li>Create, upload, or share AI research briefs</li>
            <li>Add reviews, comments, or interact with content</li>
            <li>Contact us for support or feedback</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            2. Personal Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The personal information we may collect includes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, profile picture</li>
            <li><strong>Content:</strong> Briefs, reviews, comments you create</li>
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent</li>
            <li><strong>Device Information:</strong> Browser type, IP address, device type</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your experience and content recommendations</li>
            <li>Send you updates, notifications, and administrative messages</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Detect, prevent, and address security or technical issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            4. Information Sharing
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We do not sell your personal information. We may share information:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li><strong>Public Content:</strong> Briefs and reviews you publish are public</li>
            <li><strong>Service Providers:</strong> With vendors who help us operate our service</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            5. Data Security
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We implement appropriate technical and organizational measures to protect your data,
            including:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure development practices</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            6. Your Rights and Choices
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct your information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Export:</strong> Download your data in a portable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            To exercise these rights, please contact us at privacy@deepscholar.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            7. Cookies and Tracking
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Keep you signed in</li>
            <li>Remember your preferences</li>
            <li>Analyze site usage and performance</li>
            <li>Provide personalized content</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            You can control cookies through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            8. Data Retention
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We retain your information for as long as your account is active or as needed to
            provide services. If you delete your account, we will delete or anonymize your data
            within 30 days, except where required by law to retain certain information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            9. Children's Privacy
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            DeepScholar is not intended for users under 13 years of age. We do not knowingly
            collect information from children under 13. If you believe we have collected
            information from a child under 13, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            10. International Data Transfers
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your information may be transferred to and processed in countries other than your
            country of residence. We ensure appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            11. Changes to This Policy
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We may update this privacy policy from time to time. We will notify you of material
            changes by posting the new policy on this page and updating the "Last Updated" date.
            Your continued use of DeepScholar after changes constitutes acceptance of the updated
            policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            12. Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            If you have questions about this privacy policy or our practices, please contact us:
          </p>
          <ul className="list-none pl-0 text-gray-600 dark:text-gray-400 mt-4 space-y-2">
            <li><strong>Email:</strong> privacy@deepscholar.com</li>
            <li><strong>Website:</strong> deepscholar.com/contact</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
