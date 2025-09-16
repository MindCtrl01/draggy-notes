// Helper function to format date as YYYY-MM-DD for consistent storage
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to format date as DD-MM-YYYY for display
export const formatDateDisplay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to format date as DD-MM-YYYY with slashes for input display
export const formatDateInput = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to format date for short display (e.g., in lists)
export const formatDateShort = (date: Date): string => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-'); // Convert DD/MM/YYYY to DD-MM-YYYY
};

// Helper function to check if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateKey(date1) === formatDateKey(date2);
};