# TAILORSPACE PLATFORM BRANDING IMPLEMENTATION
## Complete Brand System for Claude Code

---

## 🎯 PROJECT CONTEXT

You are implementing the official TailorSpace brand across the entire platform. TailorSpace is Nottingham's first doorstep tailoring service—a three-sided marketplace connecting **customers**, **tailors**, and **runners**.

**Launch Date:** January 5, 2026  
**Location:** Nottingham, UK

---

## 🎨 BRAND IDENTITY

### Brand Colors (OFFICIAL)

```css
:root {
  /* ══════════════════════════════════════════════════════════════
     PRIMARY BRAND COLORS
     ══════════════════════════════════════════════════════════════ */
  
  /* Indigo - Primary Brand Color */
  --brand-primary: #4F46E5;
  --brand-primary-light: #6366F1;
  --brand-primary-dark: #3730A3;
  --brand-primary-50: #EEF2FF;
  
  /* Amber - Accent Color (The Golden Destination) */
  --brand-accent: #F59E0B;
  --brand-accent-light: #FBBF24;
  
  /* Brand Gradient */
  --brand-gradient: linear-gradient(135deg, #4F46E5, #6366F1);
  --brand-gradient-dark: linear-gradient(135deg, #3730A3, #4F46E5);
  
  /* ══════════════════════════════════════════════════════════════
     SEMANTIC COLORS (for status, feedback, actors)
     ══════════════════════════════════════════════════════════════ */
  
  /* Success - Runner/Delivery/Confirmations */
  --success: #10B981;
  --success-light: #D1FAE5;
  --success-dark: #047857;
  
  /* Warning - Operations/Alerts/QC */
  --warning: #F59E0B;
  --warning-light: #FEF3C7;
  --warning-dark: #B45309;
  
  /* Danger - Errors/Urgent */
  --danger: #EF4444;
  --danger-light: #FEE2E2;
  --danger-dark: #B91C1C;
  
  /* Info - Cyan for post-service/ratings */
  --info: #06B6D4;
  --info-light: #CFFAFE;
  --info-dark: #0E7490;
  
  /* ══════════════════════════════════════════════════════════════
     NEUTRAL PALETTE (Slate)
     ══════════════════════════════════════════════════════════════ */
  
  --slate-50: #F8FAFC;   /* Page backgrounds */
  --slate-100: #F1F5F9;  /* Card backgrounds, alt rows */
  --slate-200: #E2E8F0;  /* Borders, dividers */
  --slate-300: #CBD5E1;  /* Disabled states */
  --slate-400: #94A3B8;  /* Placeholder text */
  --slate-500: #64748B;  /* Secondary text */
  --slate-600: #475569;  /* Body text */
  --slate-700: #334155;  /* Headers */
  --slate-800: #1E293B;  /* Primary text */
  --slate-900: #0F172A;  /* Darkest, dark mode bg */
}
```

### Typography

```css
:root {
  /* Font Families */
  --font-display: 'DM Sans', -apple-system, sans-serif;  /* Logo, headlines */
  --font-body: 'Inter', -apple-system, sans-serif;       /* Body text, UI */
  
  /* Import both fonts */
  /* Google Fonts: DM Sans (500, 600, 700) + Inter (400, 500, 600, 700, 800) */
  
  /* Type Scale */
  --text-xs: 0.6875rem;    /* 11px - Labels, timestamps */
  --text-sm: 0.8125rem;    /* 13px - Secondary text */
  --text-base: 0.875rem;   /* 14px - Body */
  --text-md: 1rem;         /* 16px - Emphasized body */
  --text-lg: 1.125rem;     /* 18px - Subtitles */
  --text-xl: 1.25rem;      /* 20px - Card titles */
  --text-2xl: 1.5rem;      /* 24px - Section headers */
  --text-3xl: 2rem;        /* 32px - Page titles */
  --text-4xl: 2.25rem;     /* 36px - Hero text */
  --text-5xl: 3rem;        /* 48px - Display */
  
  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  
  /* Wordmark Specific */
  --wordmark-font: 'DM Sans', sans-serif;
  --wordmark-weight: 700;
  --wordmark-spacing: -0.5px;
}
```

### Logo Specifications

```
LOGO MARK ANATOMY:
┌─────────────────────────────────┐
│  ┌─────────────────────────┐   │  ← Indigo background (#4F46E5)
│  │                         │   │
│  │   ─── ─── ─── ●        │   │  ← Running stitch (white) + Golden dot (#FBBF24)
│  │                         │   │
│  └─────────────────────────┘   │  ← Inner rounded square (white stroke)
└─────────────────────────────────┘

MEANING:
• Outer square: The platform/space
• Inner rounded square: The ecosystem container  
• Running stitch (---): The journey (pickup → processing → delivery)
• Golden dot (●): The destination, completion moment

CORNER RADIUS:
• App icon (512px): rx="128" (25%)
• Standard (80px): rx="20" (25%)
• Favicon (32px): rx="8" (25%)
```

**Logo Files Available:**
- `tailorspace-logo-final-primary.svg` — Full lockup, light backgrounds
- `tailorspace-logo-final-white.svg` — Full lockup, dark backgrounds
- `tailorspace-icon-final.svg` — App icon (512x512)
- `tailorspace-favicon.svg` — Favicon (32x32)

---

## 👥 ACTOR COLOR SYSTEM

Each actor in the ecosystem has an assigned color for instant recognition:

| Actor | Primary | Light BG | Dark | Use In |
|-------|---------|----------|------|--------|
| **Customer** | `#4F46E5` (Indigo) | `#EEF2FF` | `#3730A3` | Customer portal, booking flows |
| **Runner** | `#10B981` (Emerald) | `#D1FAE5` | `#047857` | Runner app, delivery tracking |
| **Tailor** | `#8B5CF6` (Violet) | `#EDE9FE` | `#6D28D9` | Tailor portal, work orders |
| **Operations** | `#F59E0B` (Amber) | `#FEF3C7` | `#B45309` | Admin console, QC workflows |
| **Platform** | `#64748B` (Slate) | `#F1F5F9` | `#334155` | System messages, automation |

```css
/* Actor-specific CSS variables */
--actor-customer: #4F46E5;
--actor-customer-light: #EEF2FF;
--actor-runner: #10B981;
--actor-runner-light: #D1FAE5;
--actor-tailor: #8B5CF6;
--actor-tailor-light: #EDE9FE;
--actor-ops: #F59E0B;
--actor-ops-light: #FEF3C7;
--actor-platform: #64748B;
--actor-platform-light: #F1F5F9;
```

---

## 📊 ORDER PHASE COLORS

Each phase of an order lifecycle has a distinct color:

| Phase | Color | Icon | SLA | Status Text |
|-------|-------|------|-----|-------------|
| **Booking** | `#4F46E5` | 📱 | < 10 min | "Order Placed" |
| **Pickup** | `#10B981` | 🚗 | 2-6 hrs | "Pickup Scheduled" / "Collected" |
| **Processing** | `#8B5CF6` | ✂️ | 48-96 hrs | "With Tailor" |
| **QC** | `#F59E0B` | ✅ | < 4 hrs | "Quality Check" |
| **Delivery** | `#EF4444` | 📦 | < 24 hrs | "Out for Delivery" |
| **Complete** | `#06B6D4` | ⭐ | — | "Delivered" |

```css
/* Phase-specific CSS variables */
--phase-booking: #4F46E5;
--phase-pickup: #10B981;
--phase-processing: #8B5CF6;
--phase-qc: #F59E0B;
--phase-delivery: #EF4444;
--phase-complete: #06B6D4;
```

---

## 📐 SPACING & LAYOUT

```css
:root {
  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  
  /* Border Radius */
  --radius-sm: 6px;     /* Tags, small elements */
  --radius-md: 8px;     /* Inputs, buttons */
  --radius-lg: 12px;    /* Cards, large buttons */
  --radius-xl: 16px;    /* Modals, large cards */
  --radius-2xl: 20px;   /* Feature sections */
  --radius-full: 9999px; /* Pills, avatars */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* Container Widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1200px;
  --container-2xl: 1400px;
}
```

---

## 🧩 COMPONENT SPECIFICATIONS

### Cards

```css
.card {
  background: white;
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-xl);  /* 16px */
  padding: var(--space-6);          /* 24px */
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--slate-100);
  margin-bottom: var(--space-5);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--slate-900);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--brand-primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--brand-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--slate-700);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  border: 2px solid var(--slate-200);
}

.btn-secondary:hover {
  background: var(--slate-50);
  border-color: var(--slate-300);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--brand-primary);
  padding: var(--space-3) var(--space-6);
  border: none;
  font-weight: var(--font-semibold);
}

.btn-ghost:hover {
  background: var(--brand-primary-50);
}
```

### Tags/Badges

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

/* Semantic variants */
.tag-primary { background: #EEF2FF; color: #4338CA; }
.tag-success { background: #D1FAE5; color: #047857; }
.tag-warning { background: #FEF3C7; color: #B45309; }
.tag-danger  { background: #FEE2E2; color: #B91C1C; }
.tag-info    { background: #CFFAFE; color: #0E7490; }
.tag-purple  { background: #EDE9FE; color: #6D28D9; }
```

### Status Indicators

```css
/* Status dot */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Status badge with dot */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

/* Phase-specific status badges */
.status-booking    { background: #EEF2FF; color: #4338CA; }
.status-pickup     { background: #D1FAE5; color: #047857; }
.status-processing { background: #EDE9FE; color: #6D28D9; }
.status-qc         { background: #FEF3C7; color: #B45309; }
.status-delivery   { background: #FEE2E2; color: #B91C1C; }
.status-complete   { background: #CFFAFE; color: #0E7490; }
```

### Alerts

```css
.alert {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border-left: 4px solid;
}

.alert-success {
  background: var(--success-light);
  border-color: var(--success);
}

.alert-warning {
  background: var(--warning-light);
  border-color: var(--warning);
}

.alert-danger {
  background: var(--danger-light);
  border-color: var(--danger);
}

.alert-info {
  background: var(--info-light);
  border-color: var(--info);
}

.alert-title {
  font-weight: var(--font-bold);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.alert-content {
  font-size: var(--text-base);
}
```

### Inputs

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--slate-800);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input::placeholder {
  color: var(--slate-400);
}

.input-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--slate-700);
  margin-bottom: var(--space-2);
}
```

---

## 🖥️ PORTAL THEMING

### Customer Portal (Indigo Primary)

```css
/* Customer portal uses brand indigo throughout */
.portal-customer {
  --portal-primary: #4F46E5;
  --portal-primary-light: #EEF2FF;
  --portal-primary-dark: #3730A3;
  
  /* Header/nav accent */
  --portal-accent: var(--portal-primary);
}

/* Apply to CTAs, progress indicators, active states */
```

### Runner App (Emerald Primary)

```css
.portal-runner {
  --portal-primary: #10B981;
  --portal-primary-light: #D1FAE5;
  --portal-primary-dark: #047857;
}

/* Task cards, confirmations, earnings highlights */
```

### Tailor Portal (Violet Primary)

```css
.portal-tailor {
  --portal-primary: #8B5CF6;
  --portal-primary-light: #EDE9FE;
  --portal-primary-dark: #6D28D9;
}

/* Work orders, accept/reject, performance display */
```

### Operations Console (Amber Primary + Dark Mode)

```css
.portal-ops {
  --portal-primary: #F59E0B;
  --portal-primary-light: #FEF3C7;
  --portal-primary-dark: #B45309;
  
  /* Dark mode background */
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-card: rgba(255, 255, 255, 0.02);
  --border-color: rgba(255, 255, 255, 0.1);
  
  /* Dark mode text */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
}
```

---

## 🌙 DARK MODE (Operations Console)

```css
/* Dark mode specific styles */
.dark {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: #F8FAFC;
}

.dark .card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .card-title {
  color: #F8FAFC;
}

.dark .text-secondary {
  color: #94A3B8;
}

.dark .text-muted {
  color: #64748B;
}

/* Glowing accents for emphasis */
.dark .glow-amber {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
}

.dark .glow-indigo {
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Add Google Fonts: `DM Sans` (500, 600, 700) + `Inter` (400-800)
- [ ] Create CSS variables file with all tokens above
- [ ] Set up base HTML/body styles with slate palette
- [ ] Add favicon and app icons to all entry points

### Phase 2: Global Components
- [ ] Button component (primary, secondary, ghost variants)
- [ ] Card component with header pattern
- [ ] Tag/Badge component with semantic variants
- [ ] Alert component with 4 variants
- [ ] Input component with focus states
- [ ] Status indicator components

### Phase 3: Logo Integration
- [ ] Header/navbar with appropriate logo variant
- [ ] Loading states with logo mark
- [ ] Empty states with logo
- [ ] Favicon in all HTML files
- [ ] PWA manifest with app icons

### Phase 4: Portal Theming
- [ ] Customer portal: Indigo theme applied
- [ ] Runner app: Emerald theme applied
- [ ] Tailor portal: Violet theme applied
- [ ] Operations console: Amber + dark mode

### Phase 5: Order Status UI
- [ ] Timeline component with phase colors
- [ ] Order cards with status badges
- [ ] Phase-appropriate icons throughout
- [ ] SLA timers with color-coded urgency

### Phase 6: Polish
- [ ] Consistent spacing (4px grid)
- [ ] All border-radius following specs
- [ ] Transitions on interactive elements
- [ ] Hover/focus states
- [ ] WCAG AA contrast compliance
- [ ] Responsive breakpoints

---

## ✅ QUALITY CRITERIA

The branding implementation is complete when:

1. **Logo**: Correct logo variant appears on every screen
2. **Colors**: No hardcoded colors; all use CSS variables
3. **Typography**: DM Sans for wordmarks, Inter for UI
4. **Actors**: Each portal uses its designated primary color
5. **Phases**: Order status uses correct phase colors
6. **Spacing**: All spacing uses 4px base unit
7. **Radius**: 16px for cards, 12px for buttons
8. **Dark mode**: Operations console has full dark theme
9. **Consistency**: Same component = same styling everywhere

---

## 📎 REFERENCE FILES

Include these files in your project:

```
/assets/
├── logos/
│   ├── tailorspace-logo-primary.svg    (light backgrounds)
│   ├── tailorspace-logo-white.svg      (dark backgrounds)
│   ├── tailorspace-icon.svg            (512x512 app icon)
│   └── tailorspace-favicon.svg         (32x32 favicon)
├── styles/
│   ├── tokens.css                      (all CSS variables)
│   ├── base.css                        (reset, typography)
│   └── components.css                  (shared components)
```

---

**Execute this branding implementation systematically. Start with design tokens, then global components, then portal-specific theming. Show me your plan before making changes.**
