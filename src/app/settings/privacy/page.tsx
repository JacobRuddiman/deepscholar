import { Metadata } from 'next';
import { DataExportCard } from '@/components/gdpr/DataExportCard';
import { AccountDeletionCard } from '@/components/gdpr/AccountDeletionCard';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy & Data - Settings',
  description: 'Manage your privacy settings and personal data',
};

export default function PrivacySettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Privacy & Data</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your personal data and privacy settings in compliance with GDPR
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Data Export */}
        <DataExportCard />

        {/* Account Deletion */}
        <AccountDeletionCard />

        {/* Privacy Information */}
        <div className="rounded-lg border bg-muted/50 p-6">
          <h2 className="text-lg font-semibold mb-3">Your Privacy Rights</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Right to Access (Article 15):</strong> You can request a copy
              of all personal data we hold about you.
            </p>
            <p>
              <strong>Right to Erasure (Article 17):</strong> You can request deletion
              of your personal data, subject to certain legal obligations.
            </p>
            <p>
              <strong>Right to Data Portability (Article 20):</strong> You can receive
              your personal data in a structured, commonly used format.
            </p>
            <p>
              <strong>Right to Rectification (Article 16):</strong> You can update
              your profile information at any time in{' '}
              <a href="/settings/profile" className="underline hover:text-foreground">
                Profile Settings
              </a>
              .
            </p>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              For questions about your data or privacy, contact us at{' '}
              <a
                href="mailto:privacy@deepscholar.com"
                className="underline hover:text-foreground"
              >
                privacy@deepscholar.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
