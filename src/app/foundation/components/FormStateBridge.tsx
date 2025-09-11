'use client';

import { useEffect, useState } from 'react';
import { WorkspaceDataService } from '../services/WorkspaceDataService';

/**
 * Form State Bridge Component
 * 
 * Bridges the DashboardDataService form state with React components.
 * Listens for form events and provides hooks for form components to
 * sync their state with the service layer.
 */

interface FormFieldUpdate {
  formId: string;
  fieldId: string;
  value: any;
  isValid: boolean;
}

interface FormSubmission {
  formId: string;
  data: Record<string, any>;
}

interface FormReset {
  formId: string;
}

export function FormStateBridge() {
  const [formUpdates, setFormUpdates] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const workspaceService = WorkspaceDataService.getInstance();
    
    // Listen for form field changes
    const handleFieldChange = (event: FormFieldUpdate) => {
      console.log('[FormStateBridge] Field changed:', event);
      
      // Update local state to trigger re-renders
      setFormUpdates(prev => ({
        ...prev,
        [`${event.formId}-${event.fieldId}`]: {
          value: event.value,
          timestamp: Date.now()
        }
      }));
      
      // Update the actual form element if it exists
      updateFormElement(event.formId, event.fieldId, event.value);
    };
    
    // Listen for form submissions
    const handleFormSubmit = (event: FormSubmission) => {
      console.log('[FormStateBridge] Form submitted:', event);
      
      // Could trigger UI notifications here
      showFormNotification(`${event.formId} submitted successfully`, 'success');
    };
    
    // Listen for form resets
    const handleFormReset = (event: FormReset) => {
      console.log('[FormStateBridge] Form reset:', event);
      
      // Reset all form fields to defaults
      const formState = workspaceService.getFormState(event.formId);
      if (formState) {
        formState.fields.forEach((field, fieldId) => {
          updateFormElement(event.formId, fieldId, field.value);
        });
      }
      
      showFormNotification(`${event.formId} reset to defaults`, 'info');
    };
    
    // Subscribe to events
    workspaceService.on('form:field-changed', handleFieldChange);
    workspaceService.on('form:submitted', handleFormSubmit);
    workspaceService.on('form:reset', handleFormReset);
    
    // Initial sync - populate forms with current state
    syncAllForms();
    
    // Cleanup
    return () => {
      workspaceService.off('form:field-changed', handleFieldChange);
      workspaceService.off('form:submitted', handleFormSubmit);
      workspaceService.off('form:reset', handleFormReset);
    };
  }, []);
  
  /**
   * Update a form element in the DOM
   */
  const updateFormElement = (formId: string, fieldId: string, value: any) => {
    // Find the form element
    const form = document.querySelector(`[data-form-id="${formId}"]`);
    if (!form) {
      console.warn(`[FormStateBridge] Form ${formId} not found in DOM`);
      return;
    }
    
    // Find the field element
    const field = form.querySelector(`[data-field-id="${fieldId}"]`) as HTMLInputElement | HTMLSelectElement;
    if (!field) {
      console.warn(`[FormStateBridge] Field ${fieldId} not found in form ${formId}`);
      return;
    }
    
    // Update the field value based on type
    if (field.type === 'checkbox') {
      (field as HTMLInputElement).checked = value === true || value === 'true';
    } else if (field.tagName === 'SELECT') {
      field.value = value;
    } else {
      field.value = value;
    }
    
    // Trigger change event to update React state
    const event = new Event('change', { bubbles: true });
    field.dispatchEvent(event);
  };
  
  /**
   * Sync all forms with service state
   */
  const syncAllForms = () => {
    const workspaceService = WorkspaceDataService.getInstance();
    const allForms = workspaceService.getAllFormsState();
    
    Object.entries(allForms).forEach(([formId, formData]: [string, any]) => {
      Object.entries(formData.fields).forEach(([fieldId, fieldData]: [string, any]) => {
        updateFormElement(formId, fieldId, fieldData.value);
      });
    });
  };
  
  /**
   * Show a notification for form actions
   */
  const showFormNotification = (message: string, type: 'success' | 'info' | 'error') => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white z-50 animate-slideUp
      ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('animate-fadeOut');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };
  
  // This component doesn't render anything visible
  return null;
}

/**
 * Hook for form components to get form state from service
 */
export function useFormState(formId: string) {
  const [formState, setFormState] = useState<any>(null);
  
  useEffect(() => {
    const workspaceService = WorkspaceDataService.getInstance();
    
    // Get initial state
    const state = workspaceService.getFormState(formId);
    if (state) {
      const allForms = workspaceService.getAllFormsState();
      setFormState(allForms[formId]);
    }
    
    // Listen for changes
    const handleFieldChange = (event: FormFieldUpdate) => {
      if (event.formId === formId) {
        const state = workspaceService.getFormState(formId);
        if (state) {
          const allForms = workspaceService.getAllFormsState();
          setFormState(allForms[formId]);
        }
      }
    };
    
    workspaceService.on('form:field-changed', handleFieldChange);
    
    return () => {
      workspaceService.off('form:field-changed', handleFieldChange);
    };
  }, [formId]);
  
  return formState;
}

/**
 * Hook for form components to update field values
 */
export function useFormField(formId: string, fieldId: string) {
  const workspaceService = WorkspaceDataService.getInstance();
  const formState = useFormState(formId);
  
  const fieldData = formState?.fields?.[fieldId];
  
  const setValue = (value: any) => {
    workspaceService.setFieldValue(formId, fieldId, value);
  };
  
  return {
    value: fieldData?.value || '',
    isValid: fieldData?.isValid ?? true,
    errorMessage: fieldData?.errorMessage,
    setValue
  };
}