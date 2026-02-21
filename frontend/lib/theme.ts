/**
 * Theme colors for the application
 * Centralized color definitions for consistent theming
 * 
 * These colors are also defined as CSS variables in globals.css
 * Use CSS variables in className for better performance: bg-[var(--theme-bg)]
 * Or use this object for inline styles or dynamic values
 */
export const theme = {
  colors: {
    // Background colors
    background: "#FFFCEE", // Cream/off-white background
    backgroundLight: "#E8F1EB", // Light green background
    backgroundDisabled: "#C8E6D0", // Disabled button background
    
    // Primary colors
    primary: "#1B7339", // Main green
    primaryDark: "#008751", // Nigeria flag green / darker green
    
    // Text colors
    text: "#141414", // Primary text (dark/black)
    textSecondary: "#595959", // Secondary text (gray)
    textMuted: "#747474", // Muted text / divider
    
    // Border colors
    border: "#303030", // Standard border
    borderDark: "#2C2C2C", // Darker border
    
    // Accent colors
    gold: "#FFD700", // Gold/yellow accent
    white: "#FFFFFF",
    black: "#000000",
    
    // Crypto colors
    usdc: "#2775CA", // USDC blue
    bitcoin: "#F7931A", // Bitcoin orange
    ethereum: "#627EEA", // Ethereum purple
    
    // Overlay colors
    overlay: "rgba(0, 0, 0, 0.5)", // Black overlay at 50% opacity
    overlayDark: "rgba(0, 0, 0, 0.7)", // Black overlay at 70% opacity
  },
} as const;

/**
 * CSS variable names for theme colors
 * Use these with Tailwind: bg-[var(--theme-bg)]
 */
export const themeVars = {
  bg: "var(--theme-bg)",
  bgLight: "var(--theme-bg-light)",
  bgDisabled: "var(--theme-bg-disabled)",
  primary: "var(--theme-primary)",
  primaryDark: "var(--theme-primary-dark)",
  text: "var(--theme-text)",
  textSecondary: "var(--theme-text-secondary)",
  textMuted: "var(--theme-text-muted)",
  border: "var(--theme-border)",
  borderDark: "var(--theme-border-dark)",
  gold: "var(--theme-gold)",
  usdc: "var(--theme-usdc)",
  bitcoin: "var(--theme-bitcoin)",
  ethereum: "var(--theme-ethereum)",
  overlay: "var(--theme-overlay)",
  overlayDark: "var(--theme-overlay-dark)",
} as const;
