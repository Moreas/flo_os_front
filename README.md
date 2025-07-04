# FloOS Frontend

A comprehensive personal productivity and organization system built with React and TypeScript.

## Features

### 🏋️‍♂️ Habit Tracking System

The habit tracking system has been updated to match the backend API structure with the following key features:

#### **New API Endpoints Used:**
- `GET /api/habits/pending_for_date/?date=YYYY-MM-DD` - Get pending habits for a specific date
- `GET /api/habits/tracking_summary/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get tracking summary for all habits
- `GET /api/habits/{habit_id}/tracking_status/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get tracking status for a specific habit
- `GET /api/habits/{habit_id}/status_for_date/?date=YYYY-MM-DD` - Get status for a specific date
- `POST /api/habits/{habit_id}/mark_completed/` - Mark habit as completed for a date
- `POST /api/habits/{habit_id}/mark_not_completed/` - Mark habit as not completed for a date

#### **Updated Components:**
- **QuickHabitTracker**: Shows pending habits for today with options to mark as completed or not completed
- **HabitTracker**: Individual habit tracking with status display and completion controls
- **TodayHabitsSummary**: Summary view showing completion rates and pending habits
- **HabitDetailView**: Detailed view with calendar tracking and status information
- **DailyHabitsPage**: Daily habit management with date selection
- **HabitList**: List view of all habits with management options

#### **Key Features:**
- **Pending Habits**: Shows habits that need to be logged for the current date
- **Status Tracking**: Displays completed, not completed, pending, and not tracked statuses
- **Calendar View**: Visual calendar showing habit completion status
- **Notes Support**: Add notes when marking habits as completed or not completed
- **Streak Tracking**: Shows current and longest streaks for each habit
- **Completion Rates**: Displays overall completion statistics

#### **Business Rules Implemented:**
- No tracking before 2025-06-27
- One instance per habit per date
- Pending status for unlogged habits on past dates
- Support for notes when logging completion

### 📚 Journal Management
- Create, edit, and delete journal entries
- Emotion tracking with emoji support
- Rich text content with markdown support
- Date-based organization and search

### 📋 Task Management
- Task creation and organization
- Priority levels (could do, should do, must do)
- Due date tracking
- Project and business associations
- Person assignments and impact tracking

### 🎯 Goal Setting
- Goal creation and tracking
- Progress monitoring
- Category organization

### 👥 People Management
- Contact information storage
- Relationship tracking
- Task and project associations

### 📁 Project Management
- Project creation and organization
- Task associations
- Progress tracking

### 🏢 Business Management
- Business entity tracking
- Associated tasks and projects
- Contact management

### 📖 Book Management
- Reading list organization
- Progress tracking
- Notes and reviews

### 🛠️ Tools Management
- Tool inventory
- Usage tracking
- Organization by category

## CSRF Token Implementation

### Overview
The frontend now implements proper CSRF token handling for Django backend authentication:

1. **Login Flow**: Gets initial CSRF token → Login → Gets fresh CSRF token for API calls
2. **API Calls**: Uses stored fresh CSRF token for all POST/PUT/DELETE requests  
3. **Logout**: Clears stored CSRF token (logout is CSRF-exempt)

### Key Functions

#### Authentication (`src/api/auth.ts`)
- `login()` - Handles the complete login flow with CSRF token refresh
- `logout()` - Clears stored CSRF token and cookies
- `getCurrentUser()` - Gets current user info (no CSRF needed)
- `getStoredCSRFToken()` - Gets the stored fresh CSRF token for API calls

#### Fetch Utilities (`src/api/fetchWithCreds.ts`)
- `fetchWithCreds()` - Basic fetch with credentials for GET requests
- `fetchWithCSRF()` - Fetch with automatic CSRF token for POST/PUT/DELETE requests

### Usage Examples

#### For New Components (Recommended)
```typescript
import { fetchWithCSRF } from '../api/fetchWithCreds';
import API_BASE from '../apiBase';

// Create a new journal entry
const createJournalEntry = async (data: any) => {
  const response = await fetchWithCSRF(`${API_BASE}/api/journal_entries/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create entry: ${response.status}`);
  }
  
  return response.json();
};
```

#### For Existing Axios Components (Migration)
```typescript
// OLD: Using axios (will fail with CSRF errors)
const response = await axios.post(`${API_BASE}/api/journal_entries/`, data);

// NEW: Using fetchWithCSRF (automatically handles CSRF)
const response = await fetchWithCSRF(`${API_BASE}/api/journal_entries/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

#### Manual CSRF Token Usage
```typescript
import { getStoredCSRFToken } from '../api/auth';

const csrfToken = getStoredCSRFToken();
if (csrfToken) {
  // Use token in custom requests
  headers['X-CSRFToken'] = csrfToken;
}
```

### Important Notes

1. **Login Required**: CSRF tokens are only available after successful login
2. **Fresh Tokens**: Django invalidates CSRF tokens after login - always use the stored fresh token
3. **Automatic Handling**: Use `fetchWithCSRF()` for automatic CSRF token management
4. **CORS Headers**: Origin header is automatically added for cross-origin requests
5. **Error Handling**: Check for 403 CSRF errors and redirect to login if needed

### Troubleshooting

- **403 CSRF Failed**: User needs to log in again to get fresh CSRF token
- **401 Unauthorized**: User session expired, redirect to login
- **CSRF token not found**: Check if user is logged in and token is stored in localStorage

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Environment Setup
Create a `.env` file in the root directory with your API configuration:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **UI Components**: Headless UI

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── ui/             # UI utility components
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── contexts/           # React contexts
└── styles/             # Global styles
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License.
#   f l o _ o s _ f r o n t 
 
 