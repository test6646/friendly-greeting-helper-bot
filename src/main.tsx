
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client';
import { toast } from 'sonner';

// Initialize Supabase realtime client for orders
console.log('Initializing Supabase realtime client for orders table...');

// Set up a global channel for system-wide order changes
supabase.channel('global-orders-channel')
  .on('postgres_changes', {
    event: '*', 
    schema: 'public',
    table: 'orders'
  }, payload => {
    console.log('Global order change received:', payload);
    
    // For INSERT events, we can show a debug toast
    if (payload.eventType === 'INSERT') {
      console.log('New order created:', payload.new);
    }
    
    // For UPDATE events with status changes
    if (payload.eventType === 'UPDATE' && payload.old.status !== payload.new.status) {
      console.log(`Order status changed: ${payload.old.status} -> ${payload.new.status}`);
    }
  })
  .subscribe(status => {
    console.log('Global orders channel status:', status);
  });

// Also listen to notifications table for real-time updates
supabase.channel('notifications-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications'
  }, payload => {
    console.log('Notification change received:', payload);
  })
  .subscribe();

createRoot(document.getElementById("root")!).render(<App />);
