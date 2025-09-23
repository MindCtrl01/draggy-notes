/**
 * UI Constants - Centralized magic numbers for consistent design
 * 
 * This file contains all the magic numbers used throughout the application
 * to maintain consistency and make changes easier to manage.
 */

// ===== NOTE CARD DIMENSIONS =====
export const NOTE_CARD = {
  /** Minimum width for note cards */
  MIN_WIDTH: 350,
  /** Minimum height for note cards */
  MIN_HEIGHT: 200,
  /** Maximum width for note cards */
  MAX_WIDTH: 350,
  /** Maximum height for note cards (when not editing) */
  MAX_HEIGHT: 600,
  /** Padding inside note cards (p-4 = 16px on each side) */
  PADDING: 16,
  /** Total horizontal padding (left + right) */
  TOTAL_HORIZONTAL_PADDING: 32,
  /** Content height offset accounting for title, date, and padding */
  CONTENT_HEIGHT_OFFSET: 100,
} as const;

// ===== LAYOUT AND POSITIONING =====
export const LAYOUT = {
  /** Width of the left sidebar */
  SIDEBAR_WIDTH: 280,
  /** Extra padding around notes in canvas */
  CANVAS_PADDING: 100,
  /** Default canvas width when no notes */
  DEFAULT_CANVAS_WIDTH: '80vw',
  /** Default canvas height when no notes */
  DEFAULT_CANVAS_HEIGHT: '100vh',
  /** Context menu minimum width */
  CONTEXT_MENU_MIN_WIDTH: 180,
} as const;

// ===== DRAG AND DROP =====
export const DRAG = {
  /** Delay before starting drag operation (in milliseconds) */
  START_DELAY: 100,
  /** X offset when centering note on canvas double-click */
  CENTER_NOTE_X_OFFSET: 100,
  /** Y offset when centering note on canvas double-click */
  CENTER_NOTE_Y_OFFSET: 75,
} as const;

// ===== TYPOGRAPHY AND TEXT =====
export const TEXT = {
  /** Maximum title length before truncation */
  MAX_TITLE_LENGTH: 50,
  /** Average characters per line in note content */
  AVG_CHARS_PER_LINE: 40,
  /** Average characters per line for truncation calculation */
  AVG_CHARS_PER_LINE_TRUNCATION: 15,
  /** Fallback character limit for note content */
  FALLBACK_CHAR_LIMIT: 1000,
  /** Minimum character limit */
  MIN_CHAR_LIMIT: 100,
  /** Average character width in pixels */
  AVG_CHAR_WIDTH: 8,
  /** Line height in pixels */
  LINE_HEIGHT: 21,
  /** Maximum lines for task text display */
  MAX_TASK_LINES: 3,
  /** Line height for task text (in em) */
  TASK_LINE_HEIGHT: 1.4,
  /** Maximum task text length for tooltip */
  MAX_TASK_TEXT_LENGTH: 100,
} as const;

// ===== ANIMATION AND TIMING =====
export const ANIMATION = {
  /** API simulation delay for note creation (in milliseconds) */
  CREATE_NOTE_DELAY: 300,
  /** API simulation delay for note updates (in milliseconds) */
  UPDATE_NOTE_DELAY: 200,
  /** Debounce delay for auto-resize textarea (in milliseconds) */
  TEXTAREA_RESIZE_DELAY: 0,
  /** Scroll to note delay (in milliseconds) */
  SCROLL_TO_NOTE_DELAY: 100,
  /** Selection pulse animation duration (in seconds) */
  PULSE_SELECTION_DURATION: 2,
  /** Smooth transition duration (in seconds) */
  TRANSITION_SMOOTH: 0.3,
  /** Quick transition duration (in seconds) */
  TRANSITION_QUICK: 0.2,
} as const;

// ===== Z-INDEX MANAGEMENT =====
export const Z_INDEX = {
  /** Base z-index for notes */
  NOTE_BASE: 1,
  /** Z-index for sidebar */
  SIDEBAR: 40,
  /** Z-index for note detail modal */
  NOTE_DETAIL_MODAL: 10001,
} as const;

// ===== TASK MODE =====
export const TASK_MODE = {
  /** Task checkbox size */
  CHECKBOX_SIZE: 5,
  /** Task delete button size */
  DELETE_BUTTON_SIZE: 6,
  /** Margin for external task elements */
  EXTERNAL_MARGIN: 24,
  /** Task mode toggle font size */
  TOGGLE_FONT_SIZE: 14,
  /** Progress bar height */
  PROGRESS_BAR_HEIGHT: 2,
  /** Task input minimum height (in em) */
  INPUT_MIN_HEIGHT: 1.4,
  /** Task input maximum height multiplier */
  INPUT_MAX_HEIGHT_MULTIPLIER: 3,
  /** Task input line height multiplier for pixels */
  INPUT_LINE_HEIGHT_PX: 16,
  /** Maximum task text length for tooltip */
  MAX_TASK_TEXT_LENGTH: 100,
} as const;

// ===== VISUAL EFFECTS =====
export const EFFECTS = {
  /** Hover transform translate Y offset */
  HOVER_TRANSLATE_Y: -2,
  /** Task item hover transform translate Y offset */
  TASK_HOVER_TRANSLATE_Y: -1,
  /** Dragging rotation angle in degrees */
  DRAG_ROTATION: 5,
  /** Dragging scale factor */
  DRAG_SCALE: 1.05,
  /** Selection scale factors */
  SELECTION_SCALE_MIN: 1.02,
  SELECTION_SCALE_MAX: 1.03,
  /** Border opacity for subtle borders */
  BORDER_OPACITY: 0.1,
  /** Background blur for backdrop */
  BACKDROP_BLUR: 10,
} as const;

// ===== NOTE DETAIL MODAL =====
export const NOTE_DETAIL = {
  /** Modal width as percentage */
  MODAL_WIDTH: '60%',
  /** Modal height as percentage */
  MODAL_HEIGHT: '85%',
  /** Content area height calculation offset */
  CONTENT_HEIGHT_OFFSET: 140,
  /** Minimum height for detail content (in rem) */
  MIN_CONTENT_HEIGHT: 24,
  /** Padding for modal content */
  MODAL_PADDING: 6,
} as const;

// ===== RESPONSIVE BREAKPOINTS =====
export const BREAKPOINTS = {
  /** Small screen breakpoint */
  SM: 640,
  /** Medium screen breakpoint */
  MD: 768,
  /** Large screen breakpoint */
  LG: 1024,
  /** Extra large screen breakpoint */
  XL: 1280,
} as const;

// ===== GRID AND SPACING =====
export const GRID = {
  /** Canvas grid dot size */
  DOT_SIZE: 1,
  /** Canvas grid spacing */
  GRID_SIZE: 40,
} as const;

// ===== CONTENT LIMITS =====
export const LIMITS = {
  /** Minimum note content height */
  MIN_CONTENT_HEIGHT: 100,
  /** Maximum note content height before scrolling */
  MAX_CONTENT_HEIGHT: 500,
  /** Default note position range for random placement */
  DEFAULT_POSITION_RANGE: {
    X_MAX_OFFSET: 250,
    Y_MAX_OFFSET: 200,
    Y_MIN_OFFSET: 100,
  },
} as const;

// ===== COLOR AND OPACITY =====
export const COLORS = {
  /** Selection box shadow colors */
  SELECTION_BOX_SHADOW: {
    PRIMARY: 'rgba(59, 130, 246, 0.5)',
    PRIMARY_GLOW: 'rgba(59, 130, 246, 0.3)',
    INTENSE: 'rgba(59, 130, 246, 0.7)',
    INTENSE_GLOW: 'rgba(59, 130, 246, 0.5)',
    SUBTLE: 'rgba(59, 130, 246, 0.3)',
    SUBTLE_GLOW: 'rgba(59, 130, 246, 0.15)',
  },
  /** Task shadow color */
  TASK_SHADOW: 'rgba(0, 0, 0, 0.1)',
  /** General opacity values */
  OPACITY: {
    HIDDEN: 0,
    LOW: 0.6,
    MEDIUM: 0.7,
    HIGH: 0.9,
    FULL: 1,
  },
} as const;
