/**
 * Tapi App Theme Configuration
 * Centralized theme tokens for consistent design:
 * - colors: Semantic and brand colors
 * - spacing: Layout padding and margins
 * - borderRadius: Rounded corner values for cards, buttons, and pills
 * - typography: Standardized font sizes
 */

export const colors = {
  // Brand colors
  primary: '#007AFF',
  primaryLight: '#E3F2FD',

  // Background and surface colors
  background: '#F2F2F7',
  card: '#FFFFFF',
  inputBg: '#FFFFFF',

  // Typography colors
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#3A3A3C',

  // Dividers and borders
  border: '#E5E5EA',
  borderDark: '#D1D1D6',

  // Status colors
  success: '#34C759',
  successBg: '#E8F5E9',

  warning: '#FF9500',
  warningBg: '#FFF3E0',
  warningText: '#E65100',

  danger: '#C62828',
  dangerBg: '#FFEBEE',

  // Query search highlights
  highlightBg: '#D0E1FD',
  highlightText: '#0056B3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  pill: 20,
  full: 9999,
};

export const typography = {
  header: 28,
  hero: 34,
  title: 17,
  subtitle: 15,
  body: 14,
  caption: 12,
  micro: 10,
};
