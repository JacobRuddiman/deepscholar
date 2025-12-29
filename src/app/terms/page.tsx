import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - DeepScholar',
  description: 'Terms of service for DeepScholar',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Terms of Service
      </h1>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Welcome to DeepScholar. By accessing or using our service, you agree to be bound by
          these Terms of Service. Please read them carefully.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            By creating an account or using DeepScholar, you agree to these terms and our Privacy
            Policy. If you do not agree, you may not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            2. Description of Service
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            DeepScholar is a platform for sharing and discovering AI-generated research briefs.
            Our service allows users to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Create and publish research briefs generated with AI assistance</li>
            <li>Browse, search, and discover briefs created by others</li>
            <li>Review and comment on published briefs</li>
            <li>Save and organize briefs for later reference</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            3. User Accounts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>Account Creation:</strong> You must provide accurate information when creating
            an account. You are responsible for maintaining the security of your account.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>Account Responsibility:</strong> You are responsible for all activities that
            occur under your account. Notify us immediately of any unauthorized use.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Age Requirement:</strong> You must be at least 13 years old to use DeepScholar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            4. User Content
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>Ownership:</strong> You retain ownership of content you create and publish on
            DeepScholar.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>License:</strong> By publishing content, you grant DeepScholar a worldwide,
            non-exclusive, royalty-free license to use, display, reproduce, and distribute your
            content on our platform.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Responsibility:</strong> You are solely responsible for your content and the
            consequences of posting or publishing it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            5. Prohibited Conduct
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You agree not to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Violate any laws or regulations</li>
            <li>Post false, misleading, or fraudulent content</li>
            <li>Infringe on intellectual property rights</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Distribute spam or unsolicited messages</li>
            <li>Attempt to access unauthorized areas of the service</li>
            <li>Interfere with or disrupt the service</li>
            <li>Use automated systems to access the service without permission</li>
            <li>Impersonate others or misrepresent your affiliation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            6. Content Guidelines
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Content posted on DeepScholar must:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Be accurate and factual to the best of your knowledge</li>
            <li>Properly cite sources and give credit where due</li>
            <li>Not contain hate speech, harassment, or discriminatory content</li>
            <li>Not contain illegal content or promote illegal activities</li>
            <li>Not contain malware, viruses, or malicious code</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            7. AI-Generated Content
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>Disclosure:</strong> AI-generated content should be clearly indicated as such.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>Accuracy:</strong> While we strive for accuracy, AI-generated content may
            contain errors. Users should verify important information.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>No Warranty:</strong> We do not guarantee the accuracy, completeness, or
            usefulness of any AI-generated content.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            8. Intellectual Property
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The DeepScholar platform, including its design, features, and functionality, is owned
            by DeepScholar and is protected by copyright, trademark, and other intellectual
            property laws.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            You may not copy, modify, distribute, or reverse engineer any part of our service
            without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            9. Termination
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We reserve the right to suspend or terminate your account at any time for:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
            <li>Violation of these terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Harm to other users or the service</li>
            <li>Extended inactivity</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            You may terminate your account at any time through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            10. Disclaimers
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            DEEPSCHOLAR IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR
            ERROR-FREE.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            11. Limitation of Liability
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEEPSCHOLAR SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
            PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
            USE, OR OTHER INTANGIBLE LOSSES.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            12. Indemnification
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You agree to indemnify and hold harmless DeepScholar from any claims, damages, losses,
            liabilities, and expenses arising from your use of the service or violation of these
            terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            13. Changes to Terms
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We may modify these terms at any time. We will notify users of material changes via
            email or through the service. Continued use after changes constitutes acceptance of
            the modified terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            14. Governing Law
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            These terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            15. Contact
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Questions about these terms? Contact us at:
          </p>
          <ul className="list-none pl-0 text-gray-600 dark:text-gray-400 mt-4 space-y-2">
            <li><strong>Email:</strong> legal@deepscholar.com</li>
            <li><strong>Website:</strong> deepscholar.com/contact</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
