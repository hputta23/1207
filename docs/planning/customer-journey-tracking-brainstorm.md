# Customer Journey Tracking - Brainstorming & Planning

**Purpose:** Admin-only analytics to track user behavior for site improvement
**Date:** 2026-01-13
**Status:** Planning Phase

---

## Table of Contents
1. [Overview](#overview)
2. [Approach Options](#approach-options)
3. [Recommended Solution](#recommended-solution)
4. [Implementation Details](#implementation-details)
5. [Admin Dashboard Features](#admin-dashboard-features)
6. [Privacy & Security](#privacy--security)
7. [Next Steps](#next-steps)

---

## Overview

### Goals
- Track user behavior and navigation patterns
- Identify popular features and pain points
- Improve user experience based on data-driven insights
- Monitor errors and performance issues
- Understand feature adoption rates

### Requirements
- Admin-only access to analytics
- No impact on user experience (lightweight tracking)
- Privacy-friendly (no PII collection unless necessary)
- Actionable insights for site improvement

---

## Approach Options

### Approach 1: Event-Based Analytics System

**Description:** Track specific user actions and send to backend for analysis.

**What to Track:**
- Page visits (Dashboard, Predictions, Simulations, Backtests)
- Feature usage (model selection, data source chosen, scroll direction toggled)
- Time spent on each page
- Button clicks and interactions
- API calls made (predict, simulate, backtest)
- Errors encountered
- Form submissions

**Implementation Flow:**
```
User Action → Track Event → Send to Backend → Store in DB → Admin Dashboard
```

**Pros:**
- ✅ Detailed insights into user behavior
- ✅ Can identify popular features and pain points
- ✅ Historical data for trend analysis
- ✅ Privacy-friendly (no PII needed)
- ✅ Real-time analytics possible
- ✅ Can aggregate across all users
- ✅ Scalable for multiple users

**Cons:**
- ❌ Requires backend API endpoints
- ❌ Database storage needed
- ❌ More complex to implement
- ❌ Network overhead for each event
- ❌ Potential data loss if backend is down

**Estimated Complexity:** High
**Best For:** Production-ready analytics with detailed insights

---

### Approach 2: Browser-Only Analytics (localStorage + Export)

**Description:** Track everything in browser, admins can export data manually.

**What to Track:**
- Session journey (pages visited in order)
- Timestamps and duration on each page
- Actions performed (clicks, submissions)
- Device/browser information
- Viewport size and resolution

**Implementation Flow:**
```
User Action → Store in localStorage → Admin page reads all data → Export as JSON/CSV
```

**Pros:**
- ✅ No backend needed
- ✅ Quick to implement
- ✅ User data stays local (privacy)
- ✅ Works offline
- ✅ No database costs

**Cons:**
- ❌ Data lost if user clears browser
- ❌ Can't aggregate across users easily
- ❌ Admin must access each user's browser or rely on manual exports
- ❌ Limited storage (localStorage size limits)
- ❌ No real-time insights

**Estimated Complexity:** Low
**Best For:** Quick prototyping or very small-scale analytics

---

### Approach 3: Hybrid - LocalStorage + Backend Sync (RECOMMENDED)

**Description:** Best of both worlds - works offline, syncs when online.

**What to Track:**
- Page navigation flow and sequence
- Feature interactions (predictions, simulations, model selections)
- Performance metrics (load times, API response times)
- Error tracking (API failures, validation errors)
- Session metadata (browser, viewport, data source)
- Time spent on each page/feature

**Implementation Flow:**
```
User Action → Store locally → Batch send to backend (every 5 min) → Admin Dashboard
```

**Pros:**
- ✅ Works offline seamlessly
- ✅ Reduces backend load (batched requests)
- ✅ Can aggregate across users
- ✅ Fallback if backend is down
- ✅ Better user experience (no network delay)
- ✅ Data survives page refreshes
- ✅ Can retry failed syncs

**Cons:**
- ❌ More complex sync logic
- ❌ Potential data loss if user never returns
- ❌ Requires both frontend and backend work
- ❌ Need to handle sync conflicts

**Estimated Complexity:** Medium
**Best For:** Production-ready solution with reliability and performance

---

### Approach 4: Simple Page View Counter + Heatmap

**Description:** Lightweight tracking of clicks and page views with visual heatmaps.

**What to Track:**
- Page view counts per route
- Click positions (x, y coordinates)
- Most used features/buttons
- Navigation paths (where users go from each page)
- Scroll depth

**Implementation Flow:**
```
Track clicks/pageviews → Store in backend → Visualize in admin heatmap
```

**Pros:**
- ✅ Visual representation (easy to understand)
- ✅ Low data storage requirements
- ✅ Quick insights into popular areas
- ✅ Simple implementation

**Cons:**
- ❌ Less detailed than full journey tracking
- ❌ Doesn't capture "why" users do things
- ❌ Limited context without session data
- ❌ Hard to track complex flows

**Estimated Complexity:** Medium
**Best For:** Quick wins and visual insights

---

## Recommended Solution: Approach 3 (Hybrid)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Actions                         │
│  (Page views, clicks, API calls, errors, etc.)         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Journey Tracker Service                    │
│  (React Hook/Service - src/services/analytics)          │
│                                                          │
│  Methods:                                               │
│  - trackPageView(pageName)                              │
│  - trackEvent(eventName, metadata)                      │
│  - trackError(error, context)                           │
│  - trackApiCall(endpoint, duration, status)             │
│  - startSession()                                       │
│  - endSession()                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│  Local Storage   │  │  Backend API     │
│  (Immediate)     │  │  (Batch sync)    │
│                  │  │                  │
│  - Queue events  │  │  POST /analytics │
│  - Persist data  │  │  - Batch events  │
│  - Retry queue   │  │  - Every 5 min   │
└──────────────────┘  └────────┬─────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │     Database       │
                    │  (PostgreSQL/      │
                    │   MongoDB)         │
                    │                    │
                    │  Tables:           │
                    │  - sessions        │
                    │  - events          │
                    │  - page_views      │
                    │  - errors          │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │   Admin Panel      │
                    │  /admin/analytics  │
                    │                    │
                    │  Views:            │
                    │  - Journeys        │
                    │  - Metrics         │
                    │  - Funnels         │
                    │  - Errors          │
                    │  - Heatmaps        │
                    └────────────────────┘
```

---

## Implementation Details

### 1. Data Structure

#### Event Schema
```typescript
interface AnalyticsEvent {
  // Event identification
  eventId: string;           // UUID
  sessionId: string;         // UUID for the session
  timestamp: string;         // ISO 8601 timestamp

  // Event type and data
  type: 'page_view' | 'click' | 'api_call' | 'error' | 'feature_usage';
  data: {
    // For page_view
    page?: string;
    referrer?: string;

    // For click
    element?: string;
    elementId?: string;
    position?: { x: number; y: number };

    // For api_call
    endpoint?: string;
    method?: string;
    duration?: number;
    status?: number;
    ticker?: string;

    // For error
    errorMessage?: string;
    errorStack?: string;

    // For feature_usage
    feature?: string;
    action?: string;
    value?: any;
  };

  // Session metadata (only sent once per session)
  metadata?: {
    userAgent: string;
    viewport: { width: number; height: number };
    dataSource: string;
    referrer: string;
    language: string;
  };
}
```

#### Session Schema
```typescript
interface AnalyticsSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  events: AnalyticsEvent[];
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    dataSource: string;
    initialReferrer: string;
    language: string;
  };
}
```

### 2. Frontend Implementation

#### File Structure
```
src/
├── services/
│   └── analytics/
│       ├── tracker.ts           # Main tracking service
│       ├── storage.ts           # LocalStorage wrapper
│       ├── sync.ts              # Backend sync logic
│       └── types.ts             # TypeScript types
├── hooks/
│   └── useAnalytics.ts          # React hook for tracking
└── components/
    └── Admin/
        └── Analytics/
            ├── Dashboard.tsx    # Main admin dashboard
            ├── JourneyMap.tsx   # User journey visualization
            ├── Metrics.tsx      # KPIs and metrics
            └── ErrorLog.tsx     # Error tracking view
```

#### Core Tracking Service (tracker.ts)
```typescript
class AnalyticsTracker {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startSession();
    this.setupSyncInterval();
  }

  trackPageView(page: string) {
    const event = {
      eventId: uuid(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      type: 'page_view',
      data: { page, referrer: document.referrer }
    };
    this.addEvent(event);
  }

  trackEvent(eventName: string, data: any) {
    const event = {
      eventId: uuid(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      type: 'feature_usage',
      data: { feature: eventName, ...data }
    };
    this.addEvent(event);
  }

  trackError(error: Error, context: any) {
    const event = {
      eventId: uuid(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      type: 'error',
      data: {
        errorMessage: error.message,
        errorStack: error.stack,
        context
      }
    };
    this.addEvent(event);
  }

  private addEvent(event: AnalyticsEvent) {
    this.events.push(event);
    AnalyticsStorage.saveEvent(event);
  }

  private async syncToBackend() {
    const pendingEvents = AnalyticsStorage.getPendingEvents();
    if (pendingEvents.length === 0) return;

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents })
      });
      AnalyticsStorage.clearSyncedEvents();
    } catch (error) {
      console.error('Failed to sync analytics', error);
    }
  }

  private setupSyncInterval() {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncToBackend();
    }, 5 * 60 * 1000);

    // Also sync on page unload
    window.addEventListener('beforeunload', () => {
      this.syncToBackend();
    });
  }
}
```

### 3. Backend Implementation

#### API Endpoints
```
POST /api/analytics/events
  - Receives batch of analytics events
  - Validates and stores in database
  - Returns success/failure

GET /admin/analytics/sessions
  - Returns all sessions with filters
  - Pagination support
  - Date range filtering

GET /admin/analytics/metrics
  - Returns aggregated metrics
  - Page view counts
  - Popular features
  - Error rates

GET /admin/analytics/journeys
  - Returns user journey paths
  - Funnel analysis
  - Drop-off points
```

### 4. What to Track

#### Page Views
- Dashboard
- Predictions
- Simulations
- Backtests
- Settings

#### Feature Usage
- Model selection (LSTM, Linear Regression, etc.)
- Data source changes (Yahoo, Alpha Vantage)
- Scroll direction toggle (our new feature!)
- Prediction submissions
- Simulation runs
- Backtest executions

#### API Calls
- `/predict` - ticker, model, duration
- `/simulate` - ticker, simulations, duration
- `/backtest` - ticker, strategy, duration

#### Errors
- API failures (timeouts, 4xx, 5xx)
- Validation errors
- JavaScript exceptions
- Network errors

#### Performance Metrics
- Page load times
- API response times
- Time to first interaction

---

## Admin Dashboard Features

### 1. Overview/Metrics Dashboard
- Total sessions (today, week, month)
- Total page views
- Average session duration
- Bounce rate
- Most visited pages
- Active users (if tracking across sessions)

### 2. Journey Visualization
- Sankey diagram showing user flow
- Most common paths
- Drop-off points
- Entry and exit pages

### 3. Feature Usage Analytics
- Most used models
- Data source popularity
- Feature adoption rates
- Time spent per feature

### 4. Error Tracking
- Error frequency
- Error types
- Affected users
- Stack traces
- Context (what user was doing)

### 5. Funnel Analysis
- Prediction funnel: View → Select Ticker → Choose Model → Submit → View Results
- Identify where users drop off
- Conversion rates per step

### 6. Heatmaps (Optional)
- Click heatmaps
- Scroll depth
- Most interacted elements

---

## Privacy & Security

### Data Collection Policy
- **Anonymous by default:** No PII collected unless user is logged in
- **Session-based:** Track sessions, not individual users
- **Transparent:** Add privacy notice in footer
- **Opt-out option:** Allow users to disable tracking
- **Secure storage:** Encrypt sensitive data in database
- **Admin-only access:** Require authentication for analytics dashboard

### GDPR/Privacy Compliance
- Don't track IP addresses (or anonymize)
- Don't track personal information
- Allow users to request data deletion
- Provide clear privacy policy
- Cookie consent (if using cookies)

### Security
- Admin authentication required
- Rate limiting on API endpoints
- Input validation on all analytics data
- Prevent XSS/injection attacks
- HTTPS only for data transmission

---

## Next Steps

### Phase 1: MVP (Minimum Viable Product)
**Goal:** Basic tracking and simple admin view

**Tasks:**
1. ✅ Brainstorm and document (this file!)
2. ⬜ Create analytics service (`src/services/analytics/tracker.ts`)
3. ⬜ Implement localStorage wrapper
4. ⬜ Add page view tracking to all routes
5. ⬜ Track scroll direction toggle (test with new feature)
6. ⬜ Create basic admin page showing event list
7. ⬜ Test and validate data collection

**Timeline:** Simple version - focused implementation
**Deliverables:** Working tracking + basic admin view

### Phase 2: Backend Integration
**Goal:** Store data in backend database

**Tasks:**
1. ⬜ Design database schema
2. ⬜ Create backend API endpoints
3. ⬜ Implement sync logic (batched uploads)
4. ⬜ Add retry mechanism for failed syncs
5. ⬜ Test end-to-end flow

**Timeline:** Moderate scope
**Deliverables:** Data persistence + reliable syncing

### Phase 3: Admin Dashboard
**Goal:** Rich analytics and visualizations

**Tasks:**
1. ⬜ Build metrics dashboard (page views, sessions, etc.)
2. ⬜ Create journey visualization (flow diagram)
3. ⬜ Add funnel analysis
4. ⬜ Implement error tracking view
5. ⬜ Add filtering and date ranges
6. ⬜ Export functionality (CSV/JSON)

**Timeline:** Full-featured dashboard
**Deliverables:** Complete admin analytics suite

### Phase 4: Advanced Features (Optional)
**Tasks:**
1. ⬜ Real-time analytics
2. ⬜ Heatmaps
3. ⬜ A/B testing framework
4. ⬜ Automated insights/recommendations
5. ⬜ Email reports for admins
6. ⬜ Mobile analytics

---

## Questions to Answer Before Starting

1. **Backend Infrastructure:**
   - Do we have a backend API already? (Yes - `/predict`, `/simulate`, `/backtest`)
   - What database should we use? (PostgreSQL, MongoDB, or existing DB?)
   - Should we create new endpoints or extend existing ones?

2. **Scope:**
   - Start with MVP or go straight to full implementation?
   - Which features are most important to track first?
   - Do we need real-time analytics or is daily aggregation enough?

3. **Privacy:**
   - Are we tracking anonymous sessions or logged-in users?
   - Do we need GDPR compliance?
   - Should tracking be opt-in or opt-out?

4. **Admin Access:**
   - Who should have access to analytics?
   - Do we need role-based access control?
   - Should it be a separate admin panel or integrated into main app?

---

## Resources & References

### Libraries to Consider
- **Analytics:**
  - `react-ga4` - Google Analytics integration
  - `mixpanel-browser` - Mixpanel SDK
  - Custom implementation (recommended for full control)

- **Visualization:**
  - `recharts` - Charts and graphs
  - `react-flow` - Journey/flow diagrams
  - `d3.js` - Advanced visualizations

- **Storage:**
  - `localforage` - Better localStorage wrapper
  - Native localStorage (simple, no deps)

### Similar Tools (for inspiration)
- Google Analytics
- Mixpanel
- Amplitude
- Hotjar
- FullStory

---

## Conclusion

**Recommended Approach:** Hybrid (Approach 3)
**Reason:** Best balance of reliability, performance, and features

**Start with:**
- Basic event tracking (page views, clicks, feature usage)
- LocalStorage for immediate storage
- Simple admin page to view events
- Add backend sync in Phase 2

**Priority Metrics:**
1. Page views per route
2. Feature usage (predictions, simulations, scroll toggle)
3. API call success/failure rates
4. User journey paths
5. Error frequency

This approach will give us actionable insights without over-engineering, while maintaining flexibility to expand later.

---

**Ready to implement?** Let me know and I'll start with Phase 1!
