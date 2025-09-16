/**
 * Color generation utilities for notes
 */

/**
 * Generates a random hex color code
 * @returns A hex color string (e.g., "#ff5733")
 */
export function generateRandomHexColor(): string {
  // Generate random values for RGB
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  // Convert to hex and pad with zeros if necessary
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  
  return `#${hex}`;
}

/**
 * Generates a random pastel hex color (softer, more suitable for note backgrounds)
 * @returns A pastel hex color string
 */
export function generateRandomPastelColor(): string {
  // Generate pastel colors by using higher base values (128-255 range)
  // This ensures lighter, more pleasant colors for note backgrounds
  const r = Math.floor(Math.random() * 127) + 128; // 128-255
  const g = Math.floor(Math.random() * 127) + 128; // 128-255
  const b = Math.floor(Math.random() * 127) + 128; // 128-255
  
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  
  return `#${hex}`;
}

/**
 * Generates a random bright color suitable for notes
 * Ensures good contrast and readability
 * @returns A bright hex color string
 */
export function generateRandomNoteColor(): string {
  // Pre-defined color ranges that work well for notes
  const colorRanges = [
    // Warm colors
    { r: [200, 255], g: [150, 220], b: [150, 200] }, // Warm pinks/oranges
    { r: [255, 255], g: [200, 255], b: [150, 200] }, // Yellows
    { r: [255, 255], g: [180, 230], b: [180, 230] }, // Light oranges
    
    // Cool colors  
    { r: [150, 200], g: [200, 255], b: [200, 255] }, // Light blues
    { r: [180, 230], g: [255, 255], b: [180, 230] }, // Light greens
    { r: [200, 255], g: [180, 230], b: [255, 255] }, // Light purples
  ];
  
  // Pick a random color range
  const range = colorRanges[Math.floor(Math.random() * colorRanges.length)];
  
  // Generate color within the selected range
  const r = Math.floor(Math.random() * (range.r[1] - range.r[0] + 1)) + range.r[0];
  const g = Math.floor(Math.random() * (range.g[1] - range.g[0] + 1)) + range.g[0];
  const b = Math.floor(Math.random() * (range.b[1] - range.b[0] + 1)) + range.b[0];
  
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  
  return `#${hex}`;
}

/**
 * Determines if a color is light or dark (for text contrast)
 * @param hexColor - Hex color string
 * @returns true if the color is light, false if dark
 */
export function isLightColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance using the standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

/**
 * Gets appropriate text color (black or white) for a given background color
 * @param backgroundColor - Background hex color
 * @returns "#000000" for light backgrounds, "#ffffff" for dark backgrounds
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}
