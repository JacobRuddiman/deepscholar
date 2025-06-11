'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, User, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import FormInput from './FormInput';
import RetryButton, { useRetry } from './RetryButton';
import { updateProfileSchema, notificationPreferencesSchema } from '@/lib/validation';

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  image: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  briefInterestUpdates: z.boolean(),
  promotionalNotifications: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type NotificationFormData = z.infer<typeof notificationFormSchema>;

interface ValidatedSettingsFormProps {
  initialProfile: {
    name: string;
    email: string;
    image?: string;
  };
  initialNotifications: {
    emailNotifications: boolean;
    briefInterestUpdates: boolean;
    promotionalNotifications: boolean;
  };
  onProfileUpdate: (data: ProfileFormData) => Promise<void>;
  onNotificationUpdate: (data: NotificationFormData) => Promise<void>;
}

export default function ValidatedSettingsForm({
  initialProfile,
  initialNotifications,
  onProfileUpdate,
  onNotificationUpdate,
}: ValidatedSettingsFormProps) {
  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: initialProfile.name,
    email: initialProfile.email,
    image: initialProfile.image ?? '',
  });
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [profileTouched, setProfileTouched] = useState<Partial<Record<keyof ProfileFormData, boolean>>>({});

  // Notification form state
  const [notificationForm, setNotificationForm] = useState<NotificationFormData>(initialNotifications);

  // Success states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // Retry hooks
  const profileRetry = useRetry(
    async () => {
      await handleProfileSubmit();
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onSuccess: () => setProfileSuccess(true),
    }
  );

  const notificationRetry = useRetry(
    async () => {
      await handleNotificationSubmit();
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onSuccess: () => setNotificationSuccess(true),
    }
  );

  // Validation functions
  const validateProfileField = (field: keyof ProfileFormData, value: string) => {
    try {
      const fieldSchema = profileFormSchema.pick({ [field]: true } as any);
      fieldSchema.parse({ [field]: value });
      setProfileErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setProfileErrors(prev => ({ ...prev, [field]: error.errors[0]?.message }));
      }
      return false;
    }
  };

  const validateProfileForm = () => {
    try {
      profileFormSchema.parse(profileForm);
      setProfileErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof ProfileFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof ProfileFormData;
            errors[field] = err.message;
          }
        });
        setProfileErrors(errors);
      }
      return false;
    }
  };

  // Profile form handlers
  const handleProfileFieldChange = (field: keyof ProfileFormData, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setProfileSuccess(false);
    
    // Validate on change if field was touched
    if (profileTouched[field]) {
      validateProfileField(field, value);
    }
  };

  const handleProfileFieldBlur = (field: keyof ProfileFormData) => {
    setProfileTouched(prev => ({ ...prev, [field]: true }));
    validateProfileField(field, profileForm[field] ?? '');
  };

  const handleProfileSubmit = async () => {
    // Mark all fields as touched
    setProfileTouched({
      name: true,
      email: true,
      image: true,
    });

    if (!validateProfileForm()) {
      throw new Error('Please fix the validation errors');
    }

    await onProfileUpdate(profileForm);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Notification form handlers
  const handleNotificationChange = (field: keyof NotificationFormData, value: boolean) => {
    setNotificationForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // If disabling master toggle, disable all sub-options
      if (field === 'emailNotifications' && !value) {
        newForm.briefInterestUpdates = false;
        newForm.promotionalNotifications = false;
      }
      
      return newForm;
    });
    setNotificationSuccess(false);
  };

  const handleNotificationSubmit = async () => {
    try {
      notificationFormSchema.parse(notificationForm);
      await onNotificationUpdate(notificationForm);
      setNotificationSuccess(true);
      setTimeout(() => setNotificationSuccess(false), 3000);
    } catch (error) {
      throw new Error('Failed to update notification preferences');
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center mb-6">
          <User className="mr-3 h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          {profileSuccess && (
            <CheckCircle className="ml-3 h-5 w-5 text-green-500" />
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); profileRetry.retry(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              name="name"
              type="text"
              value={profileForm.name}
              error={profileErrors.name}
              touched={profileTouched.name}
              required
              maxLength={100}
              placeholder="Enter your full name"
              onChange={(value) => handleProfileFieldChange('name', value)}
              onBlur={() => handleProfileFieldBlur('name')}
              helpText="This name will be displayed on your profile and briefs"
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={profileForm.email}
              error={profileErrors.email}
              touched={profileTouched.email}
              required
              placeholder="Enter your email address"
              onChange={(value) => handleProfileFieldChange('email', value)}
              onBlur={() => handleProfileFieldBlur('email')}
              helpText="Used for notifications and account recovery"
            />
          </div>

          <FormInput
            label="Profile Image URL"
            name="image"
            type="url"
            value={profileForm.image ?? ''}
            error={profileErrors.image}
            touched={profileTouched.image}
            placeholder="https://example.com/your-image.jpg"
            onChange={(value) => handleProfileFieldChange('image', value)}
            onBlur={() => handleProfileFieldBlur('image')}
            helpText="Optional: URL to your profile picture"
            className="md:col-span-2"
          />

          <div className="flex justify-end mt-6">
            {profileRetry.lastError ? (
              <RetryButton
                onRetry={profileRetry.retry}
                disabled={!profileRetry.canRetry}
                maxRetries={3}
                variant="primary"
              >
                Save Profile
              </RetryButton>
            ) : (
              <button
                type="submit"
                disabled={profileRetry.isRetrying}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                <Save className="mr-2 h-4 w-4" />
                {profileRetry.isRetrying ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>

          {profileSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Profile updated successfully!</span>
              </div>
            </div>
          )}
        </form>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center mb-6">
          <Bell className="mr-3 h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Notification Preferences</h2>
          {notificationSuccess && (
            <CheckCircle className="ml-3 h-5 w-5 text-green-500" />
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); notificationRetry.retry(); }}>
          {/* Master Email Notifications Toggle */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-blue-900">Email Notifications</h3>
                <p className="text-sm text-blue-700">
                  Master control for all email notifications. When disabled, you won&apos;t receive any emails.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationForm.emailNotifications}
                  onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Sub-notification options */}
          <div className={`space-y-4 ml-6 ${!notificationForm.emailNotifications ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border-l-4 border-gray-300">
              <div>
                <h3 className="font-medium">Brief Updates</h3>
                <p className="text-sm text-gray-500">
                  Get notified when your briefs receive interactions (upvotes, reviews)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationForm.briefInterestUpdates}
                  disabled={!notificationForm.emailNotifications}
                  onChange={(e) => handleNotificationChange('briefInterestUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!notificationForm.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border-l-4 border-gray-300">
              <div>
                <h3 className="font-medium">Promotional Emails</h3>
                <p className="text-sm text-gray-500">
                  Get notified about platform updates and re-engagement emails
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationForm.promotionalNotifications}
                  disabled={!notificationForm.emailNotifications}
                  onChange={(e) => handleNotificationChange('promotionalNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!notificationForm.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            {notificationRetry.lastError ? (
              <RetryButton
                onRetry={notificationRetry.retry}
                disabled={!notificationRetry.canRetry}
                maxRetries={3}
                variant="primary"
              >
                Save Preferences
              </RetryButton>
            ) : (
              <button
                type="submit"
                disabled={notificationRetry.isRetrying}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                <Save className="mr-2 h-4 w-4" />
                {notificationRetry.isRetrying ? 'Saving...' : 'Save Preferences'}
              </button>
            )}
          </div>

          {notificationSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Notification preferences updated successfully!</span>
              </div>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
