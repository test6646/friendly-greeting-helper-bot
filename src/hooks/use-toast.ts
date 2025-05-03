
import * as React from "react"

// Define the ToastActionElement type since it's not exported from the toast component
export type ToastActionElement = React.ReactElement<unknown>

// Define custom ToastProps type with description
export interface ToastProps {
  id?: string;
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
}

interface ToastState {
  toasts: ToastProps[];
}

// Create a single instance of state to manage toasts
const state: ToastState = {
  toasts: [],
};

// Function to add toast and remove previous ones
const addToast = (toast: ToastProps): string => {
  // Generate a unique ID
  const id = toast.id || String(Math.random());
  
  // Clear any existing toasts before adding a new one
  state.toasts = [];
  
  // Add the new toast
  state.toasts.push({
    ...toast,
    id,
  });
  
  // Auto-dismiss after specified duration
  setTimeout(() => {
    dismissToast(id);
  }, toast.duration || 5000);
  
  return id;
};

// Function to dismiss a toast
const dismissToast = (id: string): void => {
  state.toasts = state.toasts.filter(t => t.id !== id);
};

// Main toast function
export const toast = (props: ToastProps) => {
  const id = addToast(props);
  
  return {
    id,
    dismiss: () => dismissToast(id),
    update: (newProps: Partial<ToastProps>) => {
      state.toasts = state.toasts.map(t => 
        t.id === id ? { ...t, ...newProps } : t
      );
    }
  };
};

// Add convenient helper methods to the toast object
toast.success = (message: string, description?: React.ReactNode) => {
  return toast({
    title: message,
    description,
    variant: "success",
    duration: 3000
  });
};

toast.error = (message: string, description?: React.ReactNode) => {
  return toast({
    title: message,
    description,
    variant: "destructive",
    duration: 5000
  });
};

toast.info = (message: string, description?: React.ReactNode) => {
  return toast({
    title: message,
    description,
    variant: "info",
    duration: 4000
  });
};

toast.warning = (message: string, description?: React.ReactNode) => {
  return toast({
    title: message,
    description,
    variant: "warning",
    duration: 5000
  });
};

// Create our own hook for consistent usage
export const useToast = () => {
  return {
    toast,
    toasts: state.toasts,
    dismiss: dismissToast,
  };
};
