'use client';

import { useState } from 'react';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';

interface ReportButtonProps {
  /**
   * Type of content being reported
   */
  contentType: 'brief' | 'review' | 'comment' | 'user';
  /**
   * ID of the content being reported
   */
  contentId: string;
  /**
   * Variant of the button
   */
  variant?: 'text' | 'icon';
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or hate speech' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
];

/**
 * Report/flag button for content moderation
 * Allows users to report inappropriate content
 */
export function ReportButton({ contentType, contentId, variant = 'text' }: ReportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit report to server
      const response = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: selectedReason,
          details,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setSubmitted(true);
      setTimeout(() => {
        setShowDialog(false);
        setSubmitted(false);
        setSelectedReason('');
        setDetails('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowDialog(true)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          aria-label="Report content"
          title="Report content"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
            />
          </svg>
        </button>

        <ReportDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          contentType={contentType}
          selectedReason={selectedReason}
          setSelectedReason={setSelectedReason}
          details={details}
          setDetails={setDetails}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitted={submitted}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        Report
      </button>

      <ReportDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        contentType={contentType}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        details={details}
        setDetails={setDetails}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitted={submitted}
      />
    </>
  );
}

function ReportDialog({
  isOpen,
  onClose,
  contentType,
  selectedReason,
  setSelectedReason,
  details,
  setDetails,
  onSubmit,
  isSubmitting,
  submitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  contentType: string;
  selectedReason: string;
  setSelectedReason: (reason: string) => void;
  details: string;
  setDetails: (details: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitted: boolean;
}) {
  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Report Submitted
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for helping keep DeepScholar safe. We'll review this report shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Report {contentType}
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Help us understand what's wrong with this {contentType}.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for reporting *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select a reason</option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={4}
              placeholder="Provide any additional context..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !selectedReason}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
