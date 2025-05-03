
export const colors = {
  saffron: '#9b87f5', // Primary: Lavender Purple
  cardamom: '#6E59A5', // Secondary: Deep Lavender
  kashmiri: '#D6BCFA', // Accent: Light Lavender
  almond: '#F1F0FB', // Background: Soft Lavender
  kalaJeera: '#2D2A32', // Text: Dark Gray
  
  // Variations
  saffronLight: 'rgba(155, 135, 245, 0.2)',
  cardamomLight: 'rgba(110, 89, 165, 0.2)',
  kashmiriLight: 'rgba(214, 188, 250, 0.2)',
  
  // Gradients
  gradients: {
    saffronToCardamom: 'linear-gradient(135deg, rgba(155, 135, 245, 0.2) 0%, rgba(110, 89, 165, 0.1) 100%)',
    cardamomToKashmiri: 'linear-gradient(135deg, rgba(110, 89, 165, 0.2) 0%, rgba(214, 188, 250, 0.1) 100%)',
    almondToSaffron: 'linear-gradient(135deg, rgba(241, 240, 251, 1) 0%, rgba(155, 135, 245, 0.2) 100%)',
  },
  
  // Grayscale
  gray: {
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Fixed colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Convert to CSS variables (for custom components)
  toCssVariables: () => {
    return {
      '--color-saffron': '#9b87f5',
      '--color-cardamom': '#6E59A5',
      '--color-kashmiri': '#D6BCFA',
      '--color-almond': '#F1F0FB',
      '--color-kala-jeera': '#2D2A32',
      
      '--color-saffron-light': 'rgba(155, 135, 245, 0.2)',
      '--color-cardamom-light': 'rgba(110, 89, 165, 0.2)',
      '--color-kashmiri-light': 'rgba(214, 188, 250, 0.2)',
      
      '--gradient-saffron-to-cardamom': 'linear-gradient(135deg, rgba(155, 135, 245, 0.2) 0%, rgba(110, 89, 165, 0.1) 100%)',
      '--gradient-cardamom-to-kashmiri': 'linear-gradient(135deg, rgba(110, 89, 165, 0.2) 0%, rgba(214, 188, 250, 0.1) 100%)',
      '--gradient-almond-to-saffron': 'linear-gradient(135deg, rgba(241, 240, 251, 1) 0%, rgba(155, 135, 245, 0.2) 100%)',
    };
  }
};
