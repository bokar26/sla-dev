# Goal Manager Implementation

## Overview

The Goal Manager provides a complete CRUD interface for user goals with live re-ranking capabilities. It includes:

- **Goal Bar** - Shows active goals with progress bars at the top of Supply Center
- **Goal Manager Drawer** - Right-side drawer for quick goal management
- **Settings Goals Page** - Full-page goal management at `/settings/goals`
- **Live Re-ranking** - Search results automatically re-rank when goals change

## Components Created

### 1. API Layer
- `apps/web/src/lib/api.js` - Added `goalsApi` with CRUD methods
- `apps/web/src/components/goals/goalsBus.js` - Event bus for live updates

### 2. Shared Components
- `apps/web/src/components/goals/GoalForm.jsx` - Reusable form for create/edit
- `apps/web/src/components/goals/GoalImpactBadge.jsx` - Shows goal impact on results
- `apps/web/src/components/goals/GoalBar.jsx` - Updated with drawer integration

### 3. Management Interfaces
- `apps/web/src/components/goals/GoalManagerDrawer.jsx` - Right-side drawer
- `apps/web/src/pages/settings/SettingsGoals.jsx` - Full-page manager

### 4. Live Updates
- `apps/web/src/pages/SlaSearchPage.jsx` - Example of auto re-search on goal changes

## Usage

### Basic Goal Management

1. **From Supply Center**: Click "Manage" in the Goal Bar to open the drawer
2. **From Settings**: Navigate to `/settings/goals` for full-page management
3. **Create Goal**: Fill out the form with title, metric, target amount, etc.
4. **Edit Goal**: Click "Edit" on any goal in the list
5. **Delete Goal**: Click "Delete" and confirm

### Live Re-ranking

Search results automatically re-rank when goals change:

```jsx
import { useGoalChange } from "@/components/goals/goalsBus";

// In any search component
useGoalChange(() => {
  if (lastQueryRef.current) {
    search(lastQueryRef.current); // Re-run search with new ranking
  }
});
```

### Goal Impact Badges

Show goal impact on search results:

```jsx
import GoalImpactBadge from "@/components/goals/GoalImpactBadge";

// In result cards
<GoalImpactBadge impacts={item.goal_impacts} />
```

## API Endpoints

- `GET /api/goals` - List all goals
- `POST /api/goals` - Create new goal
- `PATCH /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal
- `GET /api/goals/progress` - Get progress summary

## Event System

The `goalsBus.js` provides:

- `emitGoalsChanged()` - Broadcast that goals have changed
- `onGoalsChanged(fn)` - Listen for goal changes
- `useGoalChange(callback)` - React hook for goal change listeners

## Backend Integration

The backend automatically:
1. Fetches active goals for the user
2. Calculates goal gain fractions for each search result
3. Applies goal-aware reranking with `final_score = base_score * (1 + α * goal_gain)`
4. Attaches `goal_impacts` array to each result for UI display

## Configuration

- `GOAL_DEFAULT_WEIGHT=0.30` - Default weight for goal influence
- Per-goal `weight` field allows fine-tuning (0-1 range)
- Goals can be paused with `is_active` flag

## File Structure

```
apps/web/src/
├── components/goals/
│   ├── GoalBar.jsx              # Updated with drawer
│   ├── GoalForm.jsx             # Shared form component
│   ├── GoalImpactBadge.jsx      # Result impact display
│   ├── GoalManagerDrawer.jsx    # Right-side drawer
│   └── goalsBus.js              # Event bus
├── pages/settings/
│   └── SettingsGoals.jsx        # Full-page manager
├── pages/
│   └── SlaSearchPage.jsx        # Example with live updates
└── lib/
    └── api.js                   # Added goalsApi
```

## Routes

- `/settings/goals` - Full-page goal management
- Goal Bar accessible from Supply Center
- Drawer opens from Goal Bar "Manage" button

All components are JS-only (.jsx) with no TypeScript syntax.
