// Calendar-specific helper functions

// Get color intensity based on note count
export const getDateColor = (noteCount: number, isToday: boolean, isSelected: boolean) => {
  if (isSelected) {
    return 'bg-blue-500 text-white';
  }
  
  if (isToday && noteCount === 0) {
    return 'bg-blue-100 text-blue-600 border-2 border-blue-300';
  }
  
  if (isToday && noteCount > 0) {
    return `bg-blue-200 text-blue-800 border-2 border-blue-400`;
  }
  
  if (noteCount === 0) {
    return 'text-gray-400 hover:bg-gray-100';
  }
  
  // Color intensity based on note count (using blue tones)
  if (noteCount === 1) return 'bg-blue-50 text-blue-600 hover:bg-blue-100';
  if (noteCount === 2) return 'bg-blue-100 text-blue-700 hover:bg-blue-150';
  if (noteCount === 3) return 'bg-blue-200 text-blue-800 hover:bg-blue-250';
  if (noteCount >= 4) return 'bg-blue-300 text-blue-900 hover:bg-blue-350';
  
  return 'text-gray-400 hover:bg-gray-100';
};

// Navigate to previous month
export const goToPreviousMonth = (currentMonth: Date) => {
  return new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
};

// Navigate to next month
export const goToNextMonth = (currentMonth: Date) => {
  return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
};
