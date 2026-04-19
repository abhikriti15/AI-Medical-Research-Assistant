# Frontend Data Mapping Fixes - Applied

## Problem Summary
Cards were displaying "UNTITLED INSIGHT" instead of real paper titles because the frontend was looking for incorrect field names that didn't match the backend response structure.

## Root Cause Analysis
**Backend Response Structure:**
```json
{
  "response": {
    "papers": [
      {
        "title": "Guidelines for the Provision...",
        "abstract": "This document represents...",
        "year": 2016,
        "source": "OpenAlex",
        "citationCount": 3877,
        "url": "https://doi.org/...",
        ...
      }
    ],
    "summary": "Based on the research query..."
  }
}
```

**Frontend Expected (Incorrect):**
- `insight.title` ✓ (correct)
- `insight.insight` ✗ (WRONG - backend sends `abstract`)
- `insight.year` ✓ (correct)
- `insight.source` ✓ (correct)

## Fixes Applied

### 1. **PaperCard.jsx** - Fixed Field Mapping
**File:** `frontend/src/components/Chat/PaperCard.jsx`

**Changes:**
- Added support for both `insight` and `paper` prop names
- Map `abstract` field to display text (backend sends `abstract`, not `insight`)
- Added fallback: `item.title || "No Title Available"` (instead of "UNTITLED INSIGHT")
- Added citation count display
- Added URL link to view the paper
- Improved text clamping logic

**Before:**
```jsx
<h4>{insight?.title || 'Untitled Insight'}</h4>
<p className="result-card-highlight">{clampText(insight?.insight || '', expanded)}</p>
```

**After:**
```jsx
const data = insight || paper || {};
const title = data?.title || 'No Title Available';
const abstractText = data?.abstract || data?.insight || '';

<h4>{title}</h4>
<p className="result-card-highlight">{clampText(abstractText, expanded)}</p>
```

### 2. **ResultsPage.jsx** - Fixed Data Extraction
**File:** `frontend/src/components/Chat/ResultsPage.jsx`

**Changes:**
- Properly extract papers from `response.papers` (not `keyResearchInsights`)
- Added debug logging to track data flow
- Improved fallback logic for insights extraction
- Better key generation for list items

**Before:**
```jsx
const insights = payload?.keyResearchInsights || payload?.papers || response?.keyResearchInsights || response?.papers || [];
```

**After:**
```jsx
const papers = payload?.papers || response?.papers || [];
const insights = papers.length > 0 ? papers : (payload?.keyResearchInsights || response?.keyResearchInsights || []);
```

### 3. **useChat.js** - Added Debug Logging
**File:** `frontend/src/hooks/useChat.js`

**Changes:**
- Added console.log statements to track API response structure
- Logs full response, papers array, and first paper object
- Helps identify data mapping issues in browser console

```javascript
console.log('useChat - Full response:', response.data);
console.log('useChat - Papers:', response.data.response?.papers);
console.log('useChat - First paper:', response.data.response?.papers?.[0]);
```

### 4. **api.js** - Added Response Logging
**File:** `frontend/src/services/api.js`

**Changes:**
- Added debug logging in `submitQuery` method
- Logs API response and papers array structure
- Helps verify data is being received correctly

```javascript
console.log('API Response:', response.data);
console.log('Papers:', response.data.response?.papers);
```

### 5. **ResultsPage.css** - Added Link Styling
**File:** `frontend/src/components/Chat/ResultsPage.css`

**Changes:**
- Added `.result-card-link` class for paper URL links
- Styled to match the design system
- Added hover effects

```css
.result-card-link {
  width: fit-content;
  border: none;
  background: transparent;
  color: #93c5fd;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 140ms ease;
}

.result-card-link:hover {
  color: #60a5fa;
  text-decoration: underline;
}
```

## Expected Results

### Before Fix:
- Cards show "UNTITLED INSIGHT" as title
- No abstract/insight text displayed
- Missing metadata (citations, URL)

### After Fix:
- Cards show real paper titles (e.g., "Guidelines for the Provision and Assessment of Nutrition Support Therapy...")
- Full abstract text displayed with "Show more/less" toggle
- Metadata displayed: Year, Source, Citation count
- "View Paper →" link to access the original paper
- Debug logs in browser console for troubleshooting

## Testing Instructions

1. Open browser DevTools (F12)
2. Go to Console tab
3. Submit a query in the frontend
4. Look for console logs:
   - `API Response:` - Full response structure
   - `Papers:` - Array of paper objects
   - `First paper:` - First paper object with all fields
   - `ResultsPage - Insights:` - Insights array being rendered
   - `ResultsPage - First insight:` - First insight object

5. Verify cards display:
   - ✓ Real paper titles
   - ✓ Abstract text (truncated with "Show more" button)
   - ✓ Year and source metadata
   - ✓ Citation count
   - ✓ "View Paper →" link

## Data Flow Diagram

```
Backend API Response
    ↓
response.data.response.papers[]
    ↓
ChatContext.setResults(response.data)
    ↓
ResultsPage receives response prop
    ↓
Extract: const papers = response.response.papers
    ↓
Map papers to PaperCard components
    ↓
PaperCard extracts: title, abstract, year, source, citationCount, url
    ↓
Display in UI with proper formatting
```

## Files Modified
1. ✅ `frontend/src/components/Chat/PaperCard.jsx`
2. ✅ `frontend/src/components/Chat/ResultsPage.jsx`
3. ✅ `frontend/src/hooks/useChat.js`
4. ✅ `frontend/src/services/api.js`
5. ✅ `frontend/src/components/Chat/ResultsPage.css`

## Status
✅ **All fixes applied and deployed**
- Frontend hot-reloaded successfully
- Backend running and responding correctly
- Ready for testing
