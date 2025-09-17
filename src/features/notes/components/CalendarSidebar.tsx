import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Note } from '@/domains/note';
import { formatDateKey, formatDateDisplay, isSameDay, generateCalendarDays } from '@/helpers/date-helper';
import { getDateColor, goToPreviousMonth, goToNextMonth } from '@/helpers/calendar-helper';

interface CalendarSidebarProps {
  allNotes: Note[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface DayInfo {
  date: Date;
  noteCount: number;
  notes: Note[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
}

export const CalendarSidebar = ({ allNotes, selectedDate, onDateSelect }: CalendarSidebarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [hoveredDay, setHoveredDay] = useState<DayInfo | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Get notes grouped by date
  const notesByDate = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    allNotes.forEach(note => {
      const dateKey = formatDateKey(note.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(note);
    });
    return groups;
  }, [allNotes]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const baseDays = generateCalendarDays(currentMonth, selectedDate);
    
    return baseDays.map(day => {
      const dateKey = formatDateKey(day.date);
      const dayNotes = notesByDate[dateKey] || [];
      
      return {
        ...day,
        noteCount: dayNotes.length,
        notes: dayNotes
      } as DayInfo;
    });
  }, [currentMonth, notesByDate, selectedDate]);

  const handlePreviousMonth = () => {
    setCurrentMonth(goToPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(goToNextMonth(currentMonth));
  };

  const handleDayClick = (day: DayInfo) => {
    onDateSelect(day.date);
  };

  const handleDayMouseEnter = (day: DayInfo, event: React.MouseEvent) => {
    if (day.noteCount > 0) {
      setHoveredDay(day);
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleDayMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleDayMouseLeave = () => {
    setHoveredDay(null);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="absolute left-4 top-20 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePreviousMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {monthName}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(day)}
            onMouseEnter={(e) => handleDayMouseEnter(day, e)}
            onMouseMove={handleDayMouseMove}
            onMouseLeave={handleDayMouseLeave}
            className={`
              relative p-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer hover:scale-105
              ${getDateColor(day.noteCount, day.isToday, day.isSelected)}
              ${!day.isCurrentMonth ? 'opacity-40' : ''}
              ${day.noteCount > 0 ? 'font-semibold' : ''}
            `}
          >
            {day.date.getDate()}
            {day.noteCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {day.noteCount > 9 ? '9+' : day.noteCount}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-[100] bg-gray-900 text-white p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-sm font-semibold mb-2">
            {formatDateDisplay(hoveredDay.date)}
          </div>
          <div className="text-xs text-gray-300 mb-2">
            {hoveredDay.noteCount} note{hoveredDay.noteCount !== 1 ? 's' : ''}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {hoveredDay.notes.slice(0, 5).map(note => (
              <div key={note.id} className="text-xs text-gray-200 truncate">
                • {note.title}
              </div>
            ))}
            {hoveredDay.notes.length > 5 && (
              <div className="text-xs text-gray-400">
                ... and {hoveredDay.notes.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
