
// Sound files for notifications
const NOTIFICATION_SOUNDS = {
  delivery: '/sounds/delivery-alert.mp3',
  system: '/sounds/notification.mp3',
  order: '/sounds/order-alert.mp3'
};

export type NotificationSoundType = keyof typeof NOTIFICATION_SOUNDS;

let audioContext: AudioContext | null = null;
let preloadedSounds: Record<NotificationSoundType, HTMLAudioElement> = {
  delivery: new Audio(),
  system: new Audio(),
  order: new Audio()
};

// Function to preload all notification sounds for faster playback
export const preloadNotificationSounds = () => {
  try {
    Object.entries(NOTIFICATION_SOUNDS).forEach(([type, soundUrl]) => {
      const audio = new Audio(soundUrl);
      audio.preload = 'auto';
      audio.load(); // Start loading the audio file
      preloadedSounds[type as NotificationSoundType] = audio;
    });
    console.log('Notification sounds preloaded successfully');
  } catch (error) {
    console.error('Failed to preload notification sounds:', error);
  }
};

// Function to play notification sound with vibration
export const playNotificationSound = (type: NotificationSoundType = 'system', vibrate = false, duration = 3000) => {
  try {
    console.log(`Attempting to play ${type} notification sound, vibrate: ${vibrate}`);
    // Get the correct sound file
    const soundFile = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.system;
    
    // Try to use a preloaded audio element if available
    const audio = preloadedSounds[type] || new Audio(soundFile);
    
    // Set volume to ensure it's audible
    audio.volume = 1.0;
    
    // Vibrate device if supported and requested
    if (vibrate && navigator.vibrate) {
      console.log('Vibrating device');
      // Vibrate for 3 seconds (3000ms) in pulses
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
    
    // Play sound with user interaction handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`Playing ${type} notification sound successfully`);
          // Set timeout to ensure audio completes
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, duration);
        })
        .catch(error => {
          console.error("Error playing notification sound:", error);
          // Create a fallback with Web Audio API on interaction
          if (!audioContext) {
            try {
              audioContext = new AudioContext();
              console.log("Created AudioContext after play failure");
            } catch (e) {
              console.error("Failed to create AudioContext:", e);
            }
          }
        });
    }
  } catch (error) {
    console.error("Failed to play notification sound:", error);
  }
};

// Function to initialize audio context on user interaction
export const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
      console.log("AudioContext initialized on user interaction");
    } catch (e) {
      console.error("Failed to create AudioContext:", e);
    }
  }
};

// Function to test a notification sound
export const testNotificationSound = (type: NotificationSoundType = 'delivery') => {
  console.log(`Testing ${type} notification sound`);
  // Initialize audio context first
  initAudioContext();
  // Play the sound with vibration
  playNotificationSound(type, true, 3000);
};
