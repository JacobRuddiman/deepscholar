import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - DeepScholar',
  description: 'Frequently asked questions about DeepScholar',
};

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is DeepScholar?',
        a: 'DeepScholar is a platform for sharing and discovering AI-generated research briefs. Users can create, publish, and browse comprehensive research summaries generated with AI assistance.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click the "Sign In" button in the top right corner and choose your preferred authentication method (Google, GitHub, or email). Your account will be created automatically.',
      },
      {
        q: 'Is DeepScholar free to use?',
        a: 'Yes! Creating an account, browsing briefs, and publishing your own content is completely free.',
      },
    ],
  },
  {
    category: 'Creating Briefs',
    questions: [
      {
        q: 'How do I create a brief?',
        a: 'Navigate to the "Create" page, enter your research prompt, and generate a brief using your preferred AI model. You can then edit, format, and publish your brief.',
      },
      {
        q: 'Which AI models can I use?',
        a: 'We support multiple AI models including GPT-4, Claude, and others. The available models are shown in the creation interface.',
      },
      {
        q: 'Can I edit a brief after publishing?',
        a: 'Yes! You can create new versions of your briefs. Previous versions remain accessible, and you can track changes over time.',
      },
      {
        q: 'How do I add sources and citations?',
        a: 'When creating or editing a brief, use the "Add Source" button to include citations. Properly citing sources helps maintain credibility and gives credit where it\'s due.',
      },
    ],
  },
  {
    category: 'Searching and Discovering',
    questions: [
      {
        q: 'How do I find briefs on specific topics?',
        a: 'Use the search bar to search by keywords, or browse by categories. You can also filter by AI model, date, and popularity.',
      },
      {
        q: 'Can I save briefs for later?',
        a: 'Yes! Click the bookmark icon on any brief to save it to your collection. Access your saved briefs from your profile page.',
      },
      {
        q: 'How do recommendations work?',
        a: 'Our recommendation system suggests briefs based on your browsing history, saved items, and briefs you\'ve upvoted.',
      },
    ],
  },
  {
    category: 'Reviews and Ratings',
    questions: [
      {
        q: 'How do I review a brief?',
        a: 'Open any brief and scroll to the reviews section. Click "Write a Review" to add your rating (1-5 stars) and comments.',
      },
      {
        q: 'Can I edit or delete my reviews?',
        a: 'Yes, you can edit your reviews at any time. You can also delete them if needed. Each user can only submit one review per brief.',
      },
      {
        q: 'What makes a good review?',
        a: 'Good reviews are specific, constructive, and helpful to other readers. Mention what you found valuable or what could be improved.',
      },
    ],
  },
  {
    category: 'Account and Privacy',
    questions: [
      {
        q: 'How do I update my profile?',
        a: 'Go to your profile page and click the "Edit Profile" button. You can update your name, bio, and profile picture.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes, you can delete your account from the account settings page. Note that this action is permanent and cannot be undone.',
      },
      {
        q: 'How is my data protected?',
        a: 'We take privacy seriously. Read our Privacy Policy to learn about how we collect, use, and protect your data.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes, you can export all your data (briefs, reviews, saved items) from your account settings.',
      },
    ],
  },
  {
    category: 'Content Guidelines',
    questions: [
      {
        q: 'What content is allowed on DeepScholar?',
        a: 'We welcome research-focused content across all fields. Content should be factual, properly cited, and respectful. See our Community Guidelines for details.',
      },
      {
        q: 'What should I do if I see inappropriate content?',
        a: 'Use the "Report" button on any brief or review that violates our guidelines. Our moderation team will review all reports.',
      },
      {
        q: 'Can I republish content from other sources?',
        a: 'You must have the right to publish any content you share. Always cite original sources and respect copyright laws.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'Is there an API available?',
        a: 'Not yet, but we\'re working on it! Join our newsletter to be notified when the API becomes available.',
      },
      {
        q: 'Can I use DeepScholar on mobile?',
        a: 'Yes! DeepScholar is fully responsive and works on all devices. We\'re also working on dedicated mobile apps.',
      },
      {
        q: 'I found a bug. How do I report it?',
        a: 'Please report bugs through our GitHub issues page or email support@deepscholar.com with details about the problem.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Frequently Asked Questions
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
        Find answers to common questions about using DeepScholar
      </p>

      <div className="space-y-12">
        {faqs.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              {section.category}
            </h2>
            <div className="space-y-6">
              {section.questions.map((faq, qIdx) => (
                <div key={qIdx}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Still have questions?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Can't find the answer you're looking for? Please reach out to our support team.
        </p>
        <a
          href="mailto:support@deepscholar.com"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
