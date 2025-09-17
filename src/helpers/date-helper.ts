// Helper function to format date as YYYY-MM-DD for consistent storage
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Helper function to generate calendar days for a given month
export const generateCalendarDays = (currentMonth: Date, selectedDate: Date) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // End at the end of the week containing the last day
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const days: Array<{
    date: Date;
    isToday: boolean;
    isSelected: boolean;
    isCurrentMonth: boolean;
  }> = [];
  const current = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    const normalizedCurrent = new Date(current);
    normalizedCurrent.setHours(0, 0, 0, 0);
    
    days.push({
      date: new Date(normalizedCurrent),
      isToday: isSameDay(normalizedCurrent, today),
      isSelected: isSameDay(normalizedCurrent, selectedDate),
      isCurrentMonth: normalizedCurrent.getMonth() === month
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

export const formatHeaderDate = (date: Date): string => {
  const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long' });
  const formattedDate = formatDateDisplay(date); // DD-MM-YYYY
  return `${dayName}, ${formattedDate}`;
};