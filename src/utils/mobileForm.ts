
import { useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Optimizes input attributes for mobile forms
 * @returns Object with optimized input attributes
 */
export function useMobileFormOptimization() {
  const isMobile = useIsMobile();
  
  // Return appropriate input attributes based on device
  const getInputAttributes = useCallback((type: string) => {
    // Base attributes
    const baseAttributes: Record<string, any> = {
      className: isMobile ? 'text-base py-2 px-3' : '',
    };
    
    // Add mobile-specific attributes
    if (isMobile) {
      // Increase touch target size
      baseAttributes.style = { minHeight: '44px' };
      
      // Set appropriate keyboard type for iOS/Android
      switch (type) {
        case 'email':
          baseAttributes.inputMode = 'email';
          baseAttributes.autoCapitalize = 'none';
          baseAttributes.autoCorrect = 'off';
          break;
        case 'tel':
          baseAttributes.inputMode = 'tel';
          baseAttributes.autoComplete = 'tel';
          break;
        case 'number':
          baseAttributes.inputMode = 'numeric';
          break;
        case 'search':
          baseAttributes.inputMode = 'search';
          break;
        default:
          break;
      }
    }
    
    return baseAttributes;
  }, [isMobile]);
  
  // Handle form submission with mobile validation
  const handleMobileSubmit = useCallback((callback: (data: any) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // Check form validity
      const form = e.target as HTMLFormElement;
      if (!form.checkValidity()) {
        // For mobile, find first invalid field and focus it
        if (isMobile) {
          const invalidField = form.querySelector(':invalid') as HTMLInputElement;
          if (invalidField) {
            invalidField.focus();
            // Scroll to the field with offset to avoid hiding under fixed elements
            invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        
        // Allow browser's native validation UI to show
        return;
      }
      
      // Form is valid, gather form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Call the provided callback with form data
      callback(data);
    };
  }, [isMobile]);
  
  return {
    getInputAttributes,
    handleMobileSubmit,
    isMobile
  };
}

/**
 * Helper to generate appropriate autocomplete attributes for form fields
 */
export const autocompleteAttributes = {
  firstName: 'given-name',
  lastName: 'family-name',
  email: 'email',
  phone: 'tel',
  address: 'street-address',
  city: 'address-level2',
  state: 'address-level1',
  postalCode: 'postal-code',
  country: 'country-name',
  username: 'username',
  password: 'new-password',
  currentPassword: 'current-password'
};

/**
 * Returns appropriate input type and pattern for different data types
 * to ensure proper mobile keyboard appearance
 */
export function getMobileInputProps(fieldType: string) {
  switch (fieldType) {
    case 'email':
      return {
        type: 'email',
        inputMode: 'email',
        autoCapitalize: 'none',
        autoCorrect: 'off',
        autoComplete: 'email'
      };
    case 'phone':
      return {
        type: 'tel',
        inputMode: 'tel',
        autoComplete: 'tel',
        pattern: '[0-9]{10}',
        title: 'Please enter a valid phone number'
      };
    case 'number':
      return {
        type: 'text',
        inputMode: 'numeric',
        pattern: '[0-9]*'
      };
    case 'price':
      return {
        type: 'text',
        inputMode: 'decimal',
        pattern: '[0-9]*\\.?[0-9]*'
      };
    case 'search':
      return {
        type: 'search',
        inputMode: 'search',
        autoComplete: 'off'
      };
    case 'password':
      return {
        type: 'password',
        autoComplete: 'new-password'
      };
    case 'currentPassword':
      return {
        type: 'password',
        autoComplete: 'current-password'
      };
    default:
      return {
        type: 'text'
      };
  }
}

/**
 * Creates a debounced function that delays execution
 * Useful for search inputs on mobile to prevent excessive API calls
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  delay: number
): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
