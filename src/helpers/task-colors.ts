/**
 * Generate task-related colors that provide good contrast with the note card background
 */
export const getTaskColors = (noteColor: string, textColor: string) => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  // Calculate luminance to determine if color is light or dark
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb = hexToRgb(noteColor);
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const isLightBackground = luminance > 0.5;

  // Generate colors based on whether the background is light or dark
  if (isLightBackground) {
    return {
      taskBgColor: 'rgba(255, 255, 255, 0.4)',
      taskBgHoverColor: 'rgba(255, 255, 255, 0.6)',
      taskBorderColor: 'rgba(0, 0, 0, 0.15)',
      
      addTaskBgColor: 'rgba(255, 255, 255, 0.2)',
      addTaskBgHoverColor: 'rgba(255, 255, 255, 0.35)',
      addTaskBorderColor: 'rgba(0, 0, 0, 0.25)',
      addTaskBorderHoverColor: 'rgba(0, 0, 0, 0.4)',
      
      progressBarBgColor: 'rgba(0, 0, 0, 0.1)',
      progressBarFillColor: 'rgba(34, 197, 94, 0.8)', // Green
    };
  } else {
    return {
      taskBgColor: 'rgba(0, 0, 0, 0.2)',
      taskBgHoverColor: 'rgba(0, 0, 0, 0.3)',
      taskBorderColor: 'rgba(255, 255, 255, 0.15)',
      
      addTaskBgColor: 'rgba(0, 0, 0, 0.1)',
      addTaskBgHoverColor: 'rgba(0, 0, 0, 0.2)',
      addTaskBorderColor: 'rgba(255, 255, 255, 0.2)',
      addTaskBorderHoverColor: 'rgba(255, 255, 255, 0.35)',
      
      progressBarBgColor: 'rgba(255, 255, 255, 0.1)',
      progressBarFillColor: 'rgba(74, 222, 128, 0.9)', // Lighter green
    };
  }
};
