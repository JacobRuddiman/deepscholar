'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface FormField {
  value: string | number | boolean | string[];
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T> {
  fields: Record<keyof T, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: string[];
}

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
}

export interface FormActions<T> {
  setValue: (field: keyof T, value: string | number | boolean | string[]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  setSubmitting: (submitting: boolean) => void;
}

export function useFormValidation<T extends Record<string, string | number | boolean | string[]>>({
  schema,
  initialValues,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  resetOnSubmit = false,
}: UseFormValidationOptions<T>): [FormState<T>, FormActions<T>] {
  // Initialize form state
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const fields = {} as Record<keyof T, FormField>;
    
    Object.keys(initialValues).forEach((key) => {
      fields[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false,
        dirty: false,
      };
    });

    return {
      fields,
      isValid: false,
      isSubmitting: false,
      submitCount: 0,
      errors: [],
    };
  });

  // Validate a single field
  const validateField = useCallback((field: keyof T): boolean => {
    const fieldValue = formState.fields[field]?.value;
    
    try {
      // Validate the entire form and check if this field has errors
      const values = {} as T;
      Object.keys(formState.fields).forEach((key) => {
        values[key as keyof T] = formState.fields[key as keyof T].value as T[keyof T];
      });

      const result = schema.safeParse(values);
      
      if (!result.success) {
        // Find errors for this specific field
        const fieldErrors = result.error.errors.filter(err => 
          err.path.length > 0 && err.path[0] === field
        );
        
        if (fieldErrors.length > 0) {
          setFormState(prev => ({
            ...prev,
            fields: {
              ...prev.fields,
              [field]: {
                ...prev.fields[field],
                error: fieldErrors[0].message,
              },
            },
          }));
          return false;
        }
      }
      
      // Clear error if validation passed
      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [field]: {
            ...prev.fields[field],
            error: undefined,
          },
        },
      }));
      return true;
    } catch (error) {
      console.error('Field validation error:', error);
      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [field]: {
            ...prev.fields[field],
            error: 'Validation error',
          },
        },
      }));
      return false;
    }
  }, [formState.fields, schema]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const values = {} as T;
    Object.keys(formState.fields).forEach((key) => {
      values[key as keyof T] = formState.fields[key as keyof T].value as T[keyof T];
    });

    const result = schema.safeParse(values);
    
    if (!result.success) {
      const newFields = { ...formState.fields };
      const fieldErrors: Record<string, string> = {};
      
      // Map Zod errors to fields
      result.error.errors.forEach((error) => {
        if (error.path.length > 0) {
          const fieldName = error.path[0] as string;
          fieldErrors[fieldName] = error.message;
        }
      });

      // Apply field errors
      Object.keys(newFields).forEach((key) => {
        if (fieldErrors[key]) {
          newFields[key as keyof T] = {
            ...newFields[key as keyof T],
            error: fieldErrors[key],
          };
        } else {
          newFields[key as keyof T] = {
            ...newFields[key as keyof T],
            error: undefined,
          };
        }
      });

      setFormState(prev => ({
        ...prev,
        fields: newFields,
        isValid: false,
        errors: result.error.errors.map(err => err.message),
      }));
      
      return false;
    } else {
      // Clear all field errors
      const newFields = { ...formState.fields };
      Object.keys(newFields).forEach((key) => {
        newFields[key as keyof T] = {
          ...newFields[key as keyof T],
          error: undefined,
        };
      });

      setFormState(prev => ({
        ...prev,
        fields: newFields,
        isValid: true,
        errors: [],
      }));
      
      return true;
    }
  }, [formState.fields, schema]);

  // Set field value
  const setValue = useCallback((field: keyof T, value: string | number | boolean | string[]) => {
    setFormState(prev => {
      const newFields = {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          value,
          dirty: true,
        },
      };

      return {
        ...prev,
        fields: newFields,
      };
    });

    // Validate on change if enabled
    if (validateOnChange) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateOnChange, validateField]);

  // Set field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          error,
        },
      },
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          error: undefined,
        },
      },
    }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          touched,
        },
      },
    }));

    // Validate on blur if enabled and field is touched
    if (validateOnBlur && touched) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateOnBlur, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    setFormState(prev => {
      const newFields = { ...prev.fields };
      Object.keys(newFields).forEach((key) => {
        newFields[key as keyof T] = {
          ...newFields[key as keyof T],
          touched: true,
        };
      });

      return {
        ...prev,
        fields: newFields,
        isSubmitting: true,
        submitCount: prev.submitCount + 1,
      };
    });

    // Validate form
    const isValid = validateForm();
    
    if (!isValid) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
      return;
    }

    // Submit if valid
    if (onSubmit) {
      try {
        const values = {} as T;
        Object.keys(formState.fields).forEach((key) => {
          values[key as keyof T] = formState.fields[key as keyof T].value as T[keyof T];
        });

        await onSubmit(values);

        if (resetOnSubmit) {
          reset();
        }
      } catch (error) {
        console.error('Form submission error:', error);
        setFormState(prev => ({
          ...prev,
          errors: [error instanceof Error ? error.message : 'Submission failed'],
        }));
      } finally {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
        }));
      }
    } else {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [formState.fields, onSubmit, resetOnSubmit, validateForm]);

  // Reset form
  const reset = useCallback(() => {
    const fields = {} as Record<keyof T, FormField>;
    
    Object.keys(initialValues).forEach((key) => {
      fields[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false,
        dirty: false,
      };
    });

    setFormState({
      fields,
      isValid: false,
      isSubmitting: false,
      submitCount: 0,
      errors: [],
    });
  }, [initialValues]);

  // Set submitting state
  const setSubmitting = useCallback((submitting: boolean) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting: submitting,
    }));
  }, []);

  const actions: FormActions<T> = {
    setValue,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    setSubmitting,
  };

  return [formState, actions];
}

// Helper hook for form field props
export function useFormField<T>(
  fieldName: keyof T,
  formState: FormState<T>,
  actions: FormActions<T>
) {
  const field = formState.fields[fieldName];
  
  return {
    value: field?.value ?? '',
    error: field?.error,
    touched: field?.touched ?? false,
    dirty: field?.dirty ?? false,
    onChange: (value: string | number | boolean | string[]) => actions.setValue(fieldName, value),
    onBlur: () => actions.setFieldTouched(fieldName, true),
    onFocus: () => actions.clearFieldError(fieldName),
    hasError: !!(field?.error && field?.touched),
  };
}

export default useFormValidation;
