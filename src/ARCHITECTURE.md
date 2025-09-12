# Project Architecture

This document outlines the refactored architecture following clean code principles and feature-based organization.

## 🏗️ Folder Structure

```
src/
├── features/                    # Feature-based modules
│   └── notes/                  # Notes feature
│       ├── components/         # Feature-specific components
│       │   ├── NoteCard.tsx   # Individual note component
│       │   └── NotesCanvas.tsx # Notes canvas component
│       ├── hooks/             # Feature-specific hooks
│       │   ├── use-notes.ts   # Notes state management
│       │   ├── use-note-drag.ts # Drag functionality
│       │   └── use-note-editing.ts # Editing functionality
│       ├── styles/            # Feature-specific styles
│       │   ├── note-card.css  # NoteCard component styles
│       │   └── notes-canvas.css # NotesCanvas component styles
│       └── index.ts           # Feature exports
├── components/                # Common/shared components
│   └── common/               # Common UI components
│       ├── ui/               # Base UI components
│       │   ├── toast.tsx     # Toast component
│       │   ├── toaster.tsx   # Toaster wrapper
│       │   ├── sonner.tsx    # Sonner toast
│       │   └── tooltip.tsx   # Tooltip component
│       └── index.ts          # Common component exports
├── hooks/                    # Common hooks
│   ├── common/              # Shared hooks
│   │   ├── use-mobile.ts    # Mobile detection hook
│   │   └── use-toast.ts     # Toast hook wrapper
│   ├── use-toast.ts         # Original toast hook (compatibility)
│   └── index.ts             # Hook exports
├── styles/                  # Global styles
│   └── theme.css           # Theme variables and colors
├── pages/                  # Page components
├── types/                  # TypeScript types
├── lib/                    # Utility functions
└── index.css              # Base styles and imports
```

## 📋 Architecture Principles

### 1. **Feature-Based Organization**
- Components are grouped by feature (e.g., `notes/`)
- Each feature is self-contained with its own components, hooks, and styles
- Features export their public API through `index.ts`

### 2. **Component Classification**
- **Feature Components**: Specific to a particular feature (`notes/components/`)
- **Common Components**: Reusable across features (`components/common/`)

### 3. **Hook Organization**
- **Feature Hooks**: Business logic specific to a feature (`notes/hooks/`)
- **Common Hooks**: Reusable utility hooks (`hooks/common/`)

### 4. **Style Organization**
- **Component Styles**: Co-located with components (`features/notes/styles/`)
- **Theme Styles**: Global design system (`styles/theme.css`)
- **Base Styles**: Application-wide base styles (`index.css`)

### 5. **Clean Separation**
- `index.css`: Only contains base styles and theme imports
- Component-specific styles are co-located with components
- Theme variables are centralized in `styles/theme.css`

## 🎯 Benefits

### **Maintainability**
- Easy to locate and modify feature-specific code
- Clear separation of concerns
- Reduced coupling between features

### **Scalability**
- New features can be added without affecting existing code
- Components and hooks are reusable
- Clear dependency boundaries

### **Developer Experience**
- Intuitive folder structure
- Co-located styles with components
- Clear import paths with aliases

### **Performance**
- Only necessary components are bundled
- Feature-based code splitting is possible
- Unused components have been removed

## 🔗 Import Aliases

The project uses path aliases for clean imports:

```typescript
// Features
import { NotesCanvas } from '@/features/notes';

// Common components
import { Toaster, Sonner } from '@/components/common';

// Hooks
import { useIsMobile } from '@/hooks';

// Utils
import { cn } from '@/lib/utils';
```

## 🧹 Removed Unused Components

The following unused shadcn/ui components were removed to reduce bundle size:
- accordion, alert-dialog, alert, aspect-ratio, avatar
- badge, breadcrumb, button, calendar, card, carousel
- chart, checkbox, collapsible, command, context-menu
- dialog, drawer, dropdown-menu, form, hover-card
- input-otp, input, label, menubar, navigation-menu
- pagination, popover, progress, radio-group, resizable
- scroll-area, select, separator, sheet, sidebar
- skeleton, slider, switch, table, tabs, textarea
- toggle-group, toggle

Only essential components are kept:
- toast, toaster, sonner, tooltip

## 🚀 Future Enhancements

This architecture supports easy addition of new features:

1. Create a new feature folder: `src/features/new-feature/`
2. Add components, hooks, and styles specific to the feature
3. Export the feature's public API through `index.ts`
4. Import and use the feature in pages or other features

This structure promotes clean, maintainable, and scalable code organization.
