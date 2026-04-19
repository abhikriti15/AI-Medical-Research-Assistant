# Hero Section - Quick Reference Guide

## 🚀 Quick Start

### Using the Hero Section
```jsx
import HeroSection from './components/Chat/HeroSection';

// In your component:
<HeroSection onQuerySelect={handleQuerySelect} />
```

### Handling Query Selection
```jsx
const handleQuerySelect = (query) => {
  setInput(query);
};
```

## 📁 File Locations

```
frontend/
├── src/
│   └── components/
│       └── Chat/
│           ├── HeroSection.jsx          ← New component
│           ├── HeroSection.css          ← New styles
│           ├── EnhancedChatInterface.jsx ← Modified
│           ├── EnhancedChat.css         ← Modified
│           └── MessageBubble.css        ← Modified
```

## 🎨 Customization Guide

### Change Hero Title
**File**: `HeroSection.jsx`
```jsx
<h1 className="hero-title">Your Custom Title Here</h1>
```

### Change Hero Subtitle
**File**: `HeroSection.jsx`
```jsx
<p className="hero-subtitle">Your custom subtitle here</p>
```

### Add/Remove Features
**File**: `HeroSection.jsx`
```jsx
const features = [
  {
    icon: '🔬',
    title: 'Feature Name',
    description: 'Feature description here.',
  },
  // Add more features...
];
```

### Change Sample Queries
**File**: `HeroSection.jsx`
```jsx
const sampleQueries = [
  'Your query here',
  'Another query',
  'Third query',
];
```

### Customize Colors
**File**: `HeroSection.css`
```css
.hero-title {
  color: #your-color; /* Change title color */
}

.hero-subtitle {
  color: #your-color; /* Change subtitle color */
}

.query-chip:hover {
  background: linear-gradient(135deg, #color1, #color2);
}
```

### Adjust Spacing
**File**: `HeroSection.css`
```css
.hero-section {
  padding: 60px 20px 40px; /* Adjust padding */
}

.hero-content {
  gap: 2.5rem; /* Adjust gap between sections */
}

.features-grid {
  gap: 1.5rem; /* Adjust feature card gap */
}
```

### Modify Animations
**File**: `HeroSection.css`
```css
@keyframes fadeInHero {
  from {
    opacity: 0;
    transform: translateY(-20px); /* Adjust animation */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-section {
  animation: fadeInHero 0.6s ease-out; /* Adjust duration */
}
```

## 🔧 Common Tasks

### Hide Hero Section
```jsx
// In EnhancedChatInterface.jsx
{messages.length === 0 ? (
  <HeroSection onQuerySelect={handleQuerySelect} />
) : null}
```

### Show Hero Section Always
```jsx
// Remove the condition:
<HeroSection onQuerySelect={handleQuerySelect} />
```

### Add More Sample Queries
```jsx
const sampleQueries = [
  'Query 1',
  'Query 2',
  'Query 3',
  'Query 4', // Add new query
];
```

### Change Feature Icons
```jsx
const features = [
  {
    icon: '🆕', // Change icon
    title: 'Feature Name',
    description: 'Description',
  },
];
```

### Disable Query Chip Click
```jsx
// In HeroSection.jsx
const handleQueryClick = (query) => {
  // onQuerySelect(query); // Comment out to disable
};
```

## 📊 CSS Classes Reference

### Hero Section Classes
```css
.hero-section              /* Main container */
.hero-content              /* Content wrapper */
.hero-header               /* Title + subtitle */
.hero-title                /* Main title */
.hero-subtitle             /* Subtitle text */
.features-grid             /* Feature cards grid */
.feature-card              /* Individual feature card */
.feature-icon              /* Feature icon */
.feature-title             /* Feature title */
.feature-description       /* Feature description */
.sample-queries-section    /* Sample queries container */
.sample-queries-label      /* "Try asking:" label */
.sample-queries-chips      /* Chips container */
.query-chip                /* Individual chip button */
```

## 🎯 Props Reference

### HeroSection Props
```jsx
<HeroSection 
  onQuerySelect={(query) => {
    // Called when user clicks a sample query chip
    // query: string - the selected query
  }}
/>
```

## 🔄 State Management

### Hero Visibility
```jsx
// Hero shows when:
messages.length === 0

// Hero hides when:
messages.length > 0

// Hero reappears when:
clearChat() is called
```

### Query Selection Flow
```
User clicks chip
    ↓
handleQueryClick(query) called
    ↓
onQuerySelect(query) callback
    ↓
handleQuerySelect(query) in parent
    ↓
setInput(query) updates state
    ↓
Input field populated
```

## 🎨 Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tablet */
@media (max-width: 1023px) and (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 767px) and (min-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

/* Small Mobile */
@media (max-width: 479px) {
  .hero-title {
    font-size: 1.25rem;
  }
}
```

## 🐛 Debugging Tips

### Check if Hero is Rendering
```jsx
// Add console.log in HeroSection.jsx
console.log('HeroSection rendered');
```

### Check Query Selection
```jsx
// Add console.log in handleQuerySelect
const handleQuerySelect = (query) => {
  console.log('Query selected:', query);
  setInput(query);
};
```

### Check Message Count
```jsx
// Add console.log in EnhancedChatInterface
console.log('Messages:', messages.length);
```

### Check CSS Loading
```
Open DevTools → Elements tab
Search for .hero-section
Check if styles are applied
```

## 📱 Testing Checklist

- [ ] Hero displays on initial load
- [ ] Hero hides after first message
- [ ] Sample queries populate input
- [ ] Feature cards have hover effects
- [ ] Animations are smooth
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] No console errors
- [ ] Keyboard navigation works

## 🚀 Performance Tips

1. **Lazy Load Hero**
   ```jsx
   const HeroSection = lazy(() => import('./HeroSection'));
   ```

2. **Memoize Component**
   ```jsx
   export default memo(HeroSection);
   ```

3. **Optimize Images**
   - Use emoji instead of images
   - Reduces bundle size

4. **CSS Optimization**
   - Use CSS Grid instead of Flexbox where possible
   - Minimize media queries
   - Use CSS variables

## 🔗 Related Files

- `EnhancedChatInterface.jsx` - Main component
- `ChatContext.jsx` - State management
- `EnhancedChat.css` - Main styles
- `MessageBubble.jsx` - Message display
- `MessageBubble.css` - Message styles

## 📚 Documentation

- `HERO_SECTION_IMPLEMENTATION.md` - Full technical docs
- `HERO_SECTION_VISUAL_GUIDE.md` - Visual specifications
- `HERO_SECTION_SUMMARY.md` - Overview
- `HERO_SECTION_QUICK_REFERENCE.md` - This file

## 💡 Tips & Tricks

### Tip 1: Add Analytics
```jsx
const handleQueryClick = (query) => {
  // Track analytics
  analytics.track('hero_query_selected', { query });
  onQuerySelect(query);
};
```

### Tip 2: Personalize Queries
```jsx
const sampleQueries = user.preferences?.queries || defaultQueries;
```

### Tip 3: Add Loading State
```jsx
<HeroSection 
  onQuerySelect={handleQuerySelect}
  isLoading={isLoading}
/>
```

### Tip 4: Disable Hero on Mobile
```jsx
{messages.length === 0 && !isMobile && (
  <HeroSection onQuerySelect={handleQuerySelect} />
)}
```

## ❓ FAQ

**Q: How do I change the hero title?**
A: Edit `HeroSection.jsx` and change the `hero-title` text.

**Q: How do I add more sample queries?**
A: Add items to the `sampleQueries` array in `HeroSection.jsx`.

**Q: How do I change the colors?**
A: Edit the CSS variables in `HeroSection.css`.

**Q: How do I disable animations?**
A: Remove or comment out the `animation` property in CSS.

**Q: How do I make hero always visible?**
A: Remove the `messages.length === 0` condition.

**Q: How do I track hero interactions?**
A: Add analytics calls in `handleQueryClick`.

---

**Quick Reference Version**: 1.0.0
**Last Updated**: April 18, 2026
