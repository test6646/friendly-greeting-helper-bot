
import { useState, FormEvent } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  match?: string;
  custom?: (value: string) => boolean;
}

interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  match?: string;
  custom?: string;
}

export interface FormField {
  value: string;
  error: string;
  rules?: ValidationRules;
  messages?: ValidationMessages;
}

export interface FormState {
  [key: string]: FormField;
}

export function useAuthForm(initialState: FormState) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string): string => {
    const field = formState[name];
    if (!field.rules) return '';

    const { rules, messages } = field;

    if (rules.required && !value.trim()) {
      return messages?.required || 'This field is required';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return messages?.minLength || `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return messages?.maxLength || `Cannot exceed ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return messages?.pattern || 'Invalid format';
    }

    if (rules.match) {
      const matchValue = formState[rules.match].value;
      if (value !== matchValue) {
        return messages?.match || 'Fields do not match';
      }
    }

    if (rules.custom && !rules.custom(value)) {
      return messages?.custom || 'Invalid input';
    }

    return '';
  };

  const updateField = (name: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: validateField(name, value),
      },
    }));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const updatedState = { ...formState };

    Object.keys(formState).forEach(fieldName => {
      const error = validateField(fieldName, formState[fieldName].value);
      updatedState[fieldName] = {
        ...updatedState[fieldName],
        error,
      };

      if (error) {
        isValid = false;
      }
    });

    setFormState(updatedState);
    return isValid;
  };

  // Update the return type to be a function directly, not a Promise
  const handleSubmit = (
    onSubmit: () => Promise<void> | void,
    onError?: (error: any) => void
  ) => (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = onSubmit();
      
      // Handle if onSubmit returns a Promise
      if (result instanceof Promise) {
        result.catch(error => {
          if (onError) {
            onError(error);
          }
        }).finally(() => {
          setIsSubmitting(false);
        });
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    const resetState = Object.fromEntries(
      Object.entries(formState).map(([key, field]) => [
        key,
        { ...field, value: '', error: '' }
      ])
    );
    setFormState(resetState as FormState);
  };

  return {
    formState,
    updateField,
    validateForm,
    handleSubmit,
    isSubmitting,
    resetForm,
  };
}
