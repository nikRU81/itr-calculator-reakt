# CLAUDE.md - ITR Calculator React Application

> Comprehensive guide for AI assistants working with the ITR (Engineering & Technical Personnel) Calculator codebase.

**Last Updated**: 2025-11-24
**Version**: 2.0
**Tech Stack**: React 19 + TypeScript + Vite + Zustand + TailwindCSS

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Tech Stack](#tech-stack)
5. [Key Conventions](#key-conventions)
6. [Development Workflow](#development-workflow)
7. [Component Patterns](#component-patterns)
8. [State Management](#state-management)
9. [Data Layer](#data-layer)
10. [Styling Guide](#styling-guide)
11. [Common Tasks](#common-tasks)
12. [Deployment](#deployment)
13. [Important Files](#important-files)

---

## 🎯 Project Overview

### Purpose
ITR Calculator is a specialized tool for calculating recommended Engineering & Technical Personnel (ITR - Инженерно-технические работники) staffing levels for construction projects. It analyzes historical data from 74 projects (January-October 2025) to provide evidence-based recommendations.

### Key Features
- **Calculator**: Recommends ITR staffing based on worker count
- **Analytics**: Project analysis dashboard with charts
- **Projects**: Monthly dynamics tracking
- **Standards**: Company-wide staffing standards
- **Labor Ratios**: ITR-to-worker ratio analysis

### Target Users
- Project managers
- HR personnel
- Construction planners
- Company executives

### Language
**Russian** - All UI text, comments, and business logic use Russian terminology.

---

## 🏗️ Architecture

### Application Type
Single Page Application (SPA) with client-side routing (simulated via state management).

### Design Pattern
**Component-based architecture** with:
- Centralized state management (Zustand)
- Presentation/Container component pattern
- Utility-based styling (TailwindCSS)

### Data Flow
```
JSON Files (public/data/)
    → Data Loaders (utils/dataLoader.ts)
    → Zustand Store (store/useStore.ts)
    → Page Components (pages/*)
    → UI Components (components/*)
```

### State Management Philosophy
- **Single source of truth**: Zustand store
- **No prop drilling**: Components access store directly
- **Minimal state**: Only application-wide state in store
- **Local state**: Form inputs use local useState

---

## 📁 Directory Structure

```
itr-calculator-reakt/
├── public/
│   └── data/                          # JSON data files (11MB total)
│       ├── calculator_config.json     # Calculator configuration
│       ├── company_standards.json     # Company-wide standards
│       ├── itr_data_2025.json        # ITR employee data (1.7MB)
│       ├── workers_data_2025.json    # Worker data (8.8MB)
│       ├── monthly_dynamics.json      # Time-series data
│       ├── position_distribution.json # Position analytics
│       ├── position_group_norms.json  # Position group standards
│       ├── projects_analysis.json     # Project summaries
│       └── scale_based_standards.json # Standards by project scale
│
├── src/
│   ├── components/
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx            # App header with title
│   │   │   ├── Layout.tsx            # Main layout wrapper
│   │   │   └── Sidebar.tsx           # Navigation sidebar
│   │   └── ui/                       # Reusable UI components
│   │       ├── Button.tsx            # Button component
│   │       ├── Card.tsx              # Card container
│   │       ├── Input.tsx             # Form input
│   │       └── MetricCard.tsx        # Metric display card
│   │
│   ├── pages/                        # Page components
│   │   ├── analytics/AnalyticsPage.tsx
│   │   ├── calculator/CalculatorPage.tsx
│   │   ├── labor/LaborPage.tsx
│   │   ├── projects/ProjectsPage.tsx
│   │   └── standards/StandardsPage.tsx
│   │
│   ├── store/
│   │   └── useStore.ts               # Zustand state management
│   │
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   │
│   ├── utils/
│   │   ├── calculator.ts             # ITR calculation logic
│   │   └── dataLoader.ts             # Data loading utilities
│   │
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles
│
├── index.html                        # HTML template
├── package.json                      # Dependencies
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript config
├── tailwind.config.js                # TailwindCSS config
├── eslint.config.js                  # ESLint configuration
├── postcss.config.js                 # PostCSS config
├── DEPLOYMENT.md                     # Vercel deployment guide
└── README.md                         # Project readme
```

---

## 🛠️ Tech Stack

### Core Technologies
- **React 19.2.0** - UI framework (latest stable)
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool & dev server
- **Zustand 5.0.8** - State management

### UI & Styling
- **TailwindCSS 3.4.18** - Utility-first CSS
- **Lucide React 0.554.0** - Icon library
- **clsx 2.1.1** - Conditional class names

### Data & Visualization
- **Recharts 3.5.0** - Charts and graphs
- **date-fns 4.1.0** - Date manipulation

### Development Tools
- **ESLint 9.39.1** - Linting
- **TypeScript ESLint 8.46.4** - TypeScript linting
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.22** - CSS vendor prefixes

### Build Output
- **Production**: `dist/` folder
- **Bundle size**: ~11MB (mostly JSON data)
- **Target**: Modern browsers (ES2020)

---

## 📐 Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `CalculatorPage.tsx`)
- **Utilities**: camelCase (e.g., `dataLoader.ts`)
- **Types**: PascalCase for interfaces (e.g., `CalculatorConfig`)
- **Constants**: UPPER_SNAKE_CASE (within files)

### Component Structure
```typescript
// 1. Imports (organized by source)
import { useState } from 'react';           // React
import { useStore } from '../../store';     // Local
import Button from '../../components/ui';   // Components
import type { CalculatorResult } from '../../types'; // Types

// 2. Type definitions (if local to file)
interface ComponentProps {
  title: string;
  onSubmit: () => void;
}

// 3. Main component
export default function Component({ title, onSubmit }: ComponentProps) {
  // 3a. Hooks (store, state, effects)
  const { data, setData } = useStore();
  const [localState, setLocalState] = useState('');

  // 3b. Event handlers
  const handleClick = () => {
    // Implementation
  };

  // 3c. Render logic
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### TypeScript Conventions
- **Strict mode enabled**: All types must be explicit
- **No `any` types**: Use `unknown` or proper typing
- **Interface over type**: Use `interface` for object shapes
- **Type imports**: Use `import type` for type-only imports
- **Null safety**: Use optional chaining and nullish coalescing

### Code Style
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: ~80-100 characters (flexible)
- **Trailing commas**: Required in multiline structures

---

## 🔄 Development Workflow

### Setup Commands
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Development Server
- **URL**: `http://localhost:5173`
- **Hot Module Replacement (HMR)**: Enabled
- **Port**: 5173 (configurable)

### Git Workflow
```bash
# Current branch
git branch

# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add new calculator feature"

# Push to remote
git push origin <branch-name>
```

### Commit Message Convention
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- style: Styling changes
- docs: Documentation
- chore: Maintenance tasks
```

---

## 🧩 Component Patterns

### Page Components
Located in `src/pages/`, these are top-level route components:

```typescript
// Example: CalculatorPage.tsx
export default function CalculatorPage() {
  const { projectName, workersCount, setProjectName } = useStore();

  return (
    <div className="space-y-6">
      {/* Page content */}
    </div>
  );
}
```

**Rules**:
- Access store directly for global state
- Use local state for form inputs
- Handle business logic here or in utils
- Compose with UI components

### Layout Components
Located in `src/components/layout/`:

```typescript
// Layout.tsx - Main layout wrapper
export default function Layout({
  children,
  currentPage,
  onPageChange
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <main>{children}</main>
    </div>
  );
}
```

**Features**:
- Responsive sidebar (mobile overlay, desktop fixed)
- Header with breadcrumbs
- Footer with copyright info

### UI Components
Located in `src/components/ui/`:

```typescript
// Button.tsx - Reusable button
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
}
```

**Guidelines**:
- Accept props for customization
- Use `clsx` for conditional classes
- Provide default values
- Export type definitions
- Keep them pure and reusable

### Custom Hooks
Currently minimal, but follow this pattern:

```typescript
// useDataLoader.ts (example)
export function useDataLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data
  }, []);

  return { loading };
}
```

---

## 🗄️ State Management

### Zustand Store
Single store in `src/store/useStore.ts`:

```typescript
export const useStore = create<AppState>((set) => ({
  // State
  projectName: '',
  workersCount: 0,
  currentPage: 'calculator',

  // Actions
  setProjectName: (name: string) => set({ projectName: name }),
  setWorkersCount: (count: number) => set({ workersCount: count }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
```

### Using the Store
```typescript
// In components
import { useStore } from '../store/useStore';

function Component() {
  // Select only what you need
  const projectName = useStore(state => state.projectName);
  const setProjectName = useStore(state => state.setProjectName);

  // Or destructure multiple values
  const { projectName, workersCount, setProjectName } = useStore();

  return <div>{projectName}</div>;
}
```

### State Categories

**Calculator State**:
- `projectName`: Current project name
- `workersCount`: Number of workers
- `calculatorResult`: Calculation result

**Data State**:
- `calculatorConfig`: Calculator configuration
- `companyStandards`: Company standards
- `projects`: List of projects
- `positionNorms`: Position group norms

**UI State**:
- `currentPage`: Active page route
- `sidebarCollapsed`: Sidebar visibility
- `loading`: Loading state
- `error`: Error message

**Filter State**:
- `projectFilters`: Active filters for projects

### When to Use Local State
Use `useState` for:
- Form input values (before submission)
- UI toggles (dropdowns, modals)
- Component-specific state
- Temporary data

Use Zustand for:
- Application-wide state
- Data shared across pages
- User preferences
- Navigation state

---

## 📊 Data Layer

### Data Files Location
All data files are in `public/data/` and loaded via fetch:

```typescript
// utils/dataLoader.ts pattern
export async function loadCalculatorConfig(): Promise<CalculatorConfig> {
  const response = await fetch('/data/calculator_config.json');
  if (!response.ok) {
    throw new Error('Failed to load calculator config');
  }
  return response.json();
}
```

### Data Files

| File | Size | Purpose |
|------|------|---------|
| `calculator_config.json` | 1.2 KB | Calculator configuration & percentages |
| `company_standards.json` | 3 KB | Company-wide statistics |
| `itr_data_2025.json` | 1.7 MB | ITR employee records |
| `workers_data_2025.json` | 8.8 MB | Worker records |
| `monthly_dynamics.json` | 177 KB | Time-series data |
| `position_distribution.json` | 51 KB | Position analytics |
| `position_group_norms.json` | 3 KB | Position standards |
| `projects_analysis.json` | 20 KB | Project summaries |
| `scale_based_standards.json` | 3.6 KB | Standards by scale |

### Data Loading Pattern
```typescript
// In page components or effects
useEffect(() => {
  async function loadData() {
    setLoading(true);
    try {
      const config = await loadCalculatorConfig();
      setCalculatorConfig(config);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }
  loadData();
}, []);
```

### Calculator Logic
Located in `src/utils/calculator.ts`:

```typescript
// Main calculator class
export class ITRCalculator {
  private config: CalculatorConfig;

  // Calculate total ITR based on worker count
  calculateTotalITR(workersCount: number): number {
    const baseRatio = this.config.base_itr_per_100_workers;
    return (workersCount / 100) * baseRatio;
  }

  // Calculate breakdown by position groups
  calculateByPositionGroups(workersCount: number): PositionBreakdown[] {
    // Implementation
  }

  // Generate full calculation result
  calculate(projectName: string, workersCount: number): CalculatorResult {
    // Implementation
  }
}
```

**Key Logic**:
- Base ratio: ~9-10 ITR per 100 workers
- Position percentages from historical data
- Minimum 1 Project Manager (ГИП)
- Round up to whole numbers

---

## 🎨 Styling Guide

### TailwindCSS Usage
Utility-first approach with custom configuration:

```typescript
// Example component
<div className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow">
  <h2 className="text-2xl font-bold text-slate-900 mb-4">Title</h2>
  <p className="text-slate-600">Content</p>
</div>
```

### Custom Theme
Defined in `tailwind.config.js`:

**Colors**:
- **Primary**: `primary-{50-950}` (Indigo shades)
- **Slate**: `slate-{50-950}` (Gray shades)

**Custom Values**:
```javascript
{
  borderRadius: {
    'lg': '12px',
  },
  boxShadow: {
    'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
    'card-hover': '0 4px 12px rgba(79, 70, 229, 0.15)',
  },
  animation: {
    'fade-in-up': 'fadeInUp 0.5s ease-out',
    'slide-in-right': 'slideInRight 0.4s ease-out',
  },
}
```

### Global Styles
Located in `src/index.css`:

```css
/* Custom base styles */
.btn {
  @apply rounded-lg font-semibold transition-all duration-200;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}

.card {
  @apply bg-white rounded-lg shadow-card p-6;
}
```

### Responsive Design
Mobile-first approach:

```tsx
<div className="
  grid
  grid-cols-1          /* Mobile */
  md:grid-cols-2       /* Tablet */
  lg:grid-cols-3       /* Desktop */
  gap-6
">
```

**Breakpoints**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Component Class Organization
```tsx
<button
  className={clsx(
    // Base styles
    'btn',
    // Variant styles
    variantClasses[variant],
    // State styles
    disabled && 'opacity-50 cursor-not-allowed',
    // Custom classes
    className
  )}
>
```

---

## ✅ Common Tasks

### Adding a New Page

1. **Create page component**:
```typescript
// src/pages/newpage/NewPage.tsx
export default function NewPage() {
  return (
    <div className="space-y-6">
      <h1>New Page</h1>
    </div>
  );
}
```

2. **Add to page config** in `App.tsx`:
```typescript
const pageConfig: Record<PageRoute, {...}> = {
  // ... existing pages
  newpage: {
    title: 'New Page',
    subtitle: 'Description',
    component: NewPage,
  },
};
```

3. **Update types** in `src/types/index.ts`:
```typescript
export type PageRoute =
  | 'calculator'
  | 'analytics'
  | 'newpage';  // Add here
```

4. **Add to sidebar** in `src/components/layout/Sidebar.tsx`:
```typescript
const navigation = [
  // ... existing items
  { name: 'New Page', route: 'newpage', icon: Icon },
];
```

### Adding a New UI Component

1. **Create component file**:
```typescript
// src/components/ui/NewComponent.tsx
import type { NewComponentProps } from '../../types';

export default function NewComponent({ prop1, prop2 }: NewComponentProps) {
  return (
    <div className="component-styles">
      {/* Implementation */}
    </div>
  );
}
```

2. **Add types** to `src/types/index.ts`:
```typescript
export interface NewComponentProps {
  prop1: string;
  prop2?: number;
}
```

3. **Use in pages**:
```typescript
import NewComponent from '../components/ui/NewComponent';

<NewComponent prop1="value" />
```

### Modifying Calculator Logic

1. **Update configuration** in `public/data/calculator_config.json`
2. **Modify calculator class** in `src/utils/calculator.ts`
3. **Test with different inputs**
4. **Update types** if needed in `src/types/index.ts`

### Adding New Data

1. **Add JSON file** to `public/data/`
2. **Create type definition** in `src/types/index.ts`
3. **Create loader function** in `src/utils/dataLoader.ts`:
```typescript
export async function loadNewData(): Promise<NewDataType> {
  const response = await fetch('/data/new_data.json');
  return response.json();
}
```
4. **Add to store** in `src/store/useStore.ts`
5. **Load in component** using useEffect

### Debugging Issues

**Check console**:
```typescript
console.log('Debug:', { variable, state, props });
```

**Check network**:
- Open DevTools → Network tab
- Verify JSON files are loading
- Check for 404 errors

**Check state**:
```typescript
// Add temporary debug component
const DebugState = () => {
  const state = useStore();
  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
```

**TypeScript errors**:
```bash
# Run type check
npm run build
```

---

## 🚀 Deployment

### Vercel (Recommended)

**Quick Deploy**:
1. Push code to GitHub
2. Import repository in Vercel
3. Deploy automatically

**Settings**:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment**:
- Node version: 18.x or higher
- No environment variables needed

### Manual Build

```bash
# Build locally
npm run build

# Output: dist/ folder
# Upload dist/ to any static hosting
```

### Build Optimization
- Vite automatically minifies code
- TailwindCSS purges unused styles
- JSON files are served as-is (~11MB)

### Post-Deployment Checks
- [ ] All pages load correctly
- [ ] Data files accessible
- [ ] Charts render properly
- [ ] Navigation works
- [ ] Responsive design intact

See `DEPLOYMENT.md` for detailed instructions.

---

## 📄 Important Files

### Configuration Files

**`package.json`**
- Dependencies and scripts
- Project metadata

**`tsconfig.json`**
- TypeScript compiler options
- References to app and node configs

**`vite.config.ts`**
- Vite build configuration
- React plugin setup

**`tailwind.config.js`**
- Custom theme configuration
- Color palette
- Animations

**`eslint.config.js`**
- Linting rules
- TypeScript ESLint configuration

### Source Files

**`src/main.tsx`**
- Application entry point
- React root rendering

**`src/App.tsx`**
- Root component
- Page routing logic
- Layout wrapper

**`src/types/index.ts`**
- All TypeScript interfaces
- Type definitions
- **CRITICAL**: Update when adding features

**`src/store/useStore.ts`**
- Zustand store
- State and actions
- **CRITICAL**: Central state management

### Data Files

**`public/data/calculator_config.json`**
- Base ITR ratio
- Position group percentages
- **CRITICAL**: Calculator logic depends on this

**Other data files**:
- Provide analytics and context
- Can be updated independently
- Size: ~11MB total

### Documentation

**`DEPLOYMENT.md`**
- Vercel deployment instructions
- Environment setup
- Troubleshooting

**`README.md`**
- Project overview
- Setup instructions

**`CLAUDE.md`** (this file)
- AI assistant guide
- Conventions and patterns

---

## 🔍 Code Search Tips

### Finding Components
```bash
# Search for component usage
grep -r "CalculatorPage" src/

# Find component definition
find src/ -name "*Calculator*.tsx"
```

### Finding Types
```bash
# Search for type usage
grep -r "CalculatorResult" src/

# All types in one file
cat src/types/index.ts
```

### Finding Store Usage
```bash
# Components using store
grep -r "useStore" src/pages/
```

---

## 🎓 Learning Resources

### React 19
- [React Docs](https://react.dev)
- New features: Actions, useTransition, etc.

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Strict mode best practices

### Zustand
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- Simple state management

### TailwindCSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- Utility classes reference

### Vite
- [Vite Docs](https://vitejs.dev)
- Build optimization

---

## 🚨 Important Notes for AI Assistants

### Language Requirements
- **UI Text**: Always use Russian
- **Comments**: Russian preferred, English acceptable
- **Variable Names**: English (standard practice)
- **Type Names**: English

### Data Sensitivity
- JSON files contain real project data
- Be careful when modifying data files
- Validate data structure after changes

### Type Safety
- Always maintain strict TypeScript
- Update types when adding features
- Use type imports for better tree-shaking

### Performance
- Be mindful of large JSON files
- Don't load unnecessary data
- Use lazy loading when appropriate

### Testing Before Commit
```bash
# Always run before committing
npm run build
npm run lint
```

### Common Pitfalls
1. ❌ Forgetting to update types
2. ❌ Not handling loading states
3. ❌ Breaking responsive design
4. ❌ Adding English text to UI
5. ❌ Importing entire store when only need part

### Best Practices
1. ✅ Update this file when adding major features
2. ✅ Keep components small and focused
3. ✅ Use existing UI components
4. ✅ Follow TailwindCSS patterns
5. ✅ Test on mobile and desktop

---

## 📝 Changelog

**2025-11-24**: Initial CLAUDE.md creation
- Comprehensive codebase documentation
- Architecture and patterns documented
- Common tasks and workflows added

---

## 🤝 Contributing

When making changes:
1. Follow conventions in this document
2. Update types if needed
3. Test thoroughly
4. Update documentation
5. Commit with clear message

---

**End of CLAUDE.md**

This document is maintained by the development team and AI assistants. Keep it updated as the codebase evolves.
