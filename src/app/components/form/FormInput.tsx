'use client';

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'number';
  placeholder?: string;
  value: string | number;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  helpText?: string;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  error,
  touched,
  required,
  disabled,
  maxLength,
  minLength,
  onChange,
  onBlur,
  onFocus,
  className = '',
  helpText,
}: FormInputProps) {
  const hasError = !!(error && touched);
  const isValid = touched && !error && value;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors
            ${hasError 
              ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
              : isValid
              ? 'border-green-500 focus:ring-green-200 focus:border-green-500'
              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
        />
        
        {/* Status icon */}
        {touched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Character count */}
      {maxLength && (
        <div className="flex justify-between items-center mt-1">
          <div className="flex-1">
            {hasError && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {helpText && !hasError && (
              <p className="text-sm text-gray-500">{helpText}</p>
            )}
          </div>
          <span className={`text-xs ${
            String(value).length > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'
          }`}>
            {String(value).length}/{maxLength}
          </span>
        </div>
      )}
      
      {/* Error message without character count */}
      {!maxLength && hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Help text without character count */}
      {!maxLength && helpText && !hasError && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
