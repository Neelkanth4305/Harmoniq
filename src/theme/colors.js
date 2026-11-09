/**
 * Harmoniq Design System — Premium Minimalist Dark Theme (Spotify Aesthetic)
 *
 * Sophisticated graphite & obsidian dark mode with signature Spotify emerald accents.
 * Complete backward & forward compatibility across all components.
 */

export const colors = {
  // Pure Premium Charcoal & Obsidian Dark Mode (Zero murky green tints)
  background: '#121212',        // Spotify's iconic deep graphite dark
  bg: '#121212',
  surface: '#181818',           // Elevated card background
  surfaceGlass: 'rgba(24, 24, 24, 0.95)',
  surfaceLight: '#242424',      // Inputs, pills, secondary cards
  surface2: '#282828',          // Hover/highlight
  surfaceElevated: '#2A2A2A',   // Modals and elevated surfaces
  card: '#181818',
  cardHover: '#222222',
  cardBorder: 'rgba(255, 255, 255, 0.08)',      // Clean subtle hairline
  cardBorderGlow: 'rgba(255, 255, 255, 0.12)',  // Clean neutral hairline border, NEVER green
  line: 'rgba(255, 255, 255, 0.08)',

  // Signature Spotify Accent (High contrast, refined, used tastefully)
  accent: '#1DB954',            // Spotify Signature Emerald
  accentLight: '#1ED760',       // Spotify Hover Green
  accentMint: '#1ED760',
  accentSoft: '#A7F3D0',
  accentDark: '#169C46',
  accentPink: '#FF4655',        // Rose pink for liked tracks
  like: '#FF4655',
  download: '#1DB954',
  warning: '#F59E0B',           // Warm Amber

  // Crisp, Ultra-Legible Typography
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',       // Crisp pure white
  textSecondary: '#A7A7A7',     // Spotify standard subtitle neutral gray
  textDim: '#A7A7A7',
  textMuted: '#71717A',         // Subdued slate gray

  // Overlays & Player Bar
  divider: 'rgba(255, 255, 255, 0.08)',
  playerBar: '#181818',
  glowGreen: 'rgba(29, 185, 84, 0.10)',
  glowDeep: 'rgba(29, 185, 84, 0.06)',
  darkOverlay: 'rgba(12, 12, 14, 0.88)',
};

export const radii = {
  card: 12,
  pill: 9999,
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 22,
  xl: 32,
};

export const sans = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const serif = sans;

export default colors;
