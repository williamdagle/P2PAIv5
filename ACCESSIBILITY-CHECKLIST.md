# Accessibility Testing Checklist

Use this checklist to ensure your pages meet accessibility standards.

## General Page Structure

### Semantic HTML
- [ ] Page has proper heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Main content wrapped in `<main>` element
- [ ] Navigation wrapped in `<nav>` element
- [ ] Complementary content in `<aside>` if applicable
- [ ] Form elements in `<form>` tags
- [ ] Lists use `<ul>`, `<ol>`, or `<dl>` as appropriate

### Page Title
- [ ] Each page has unique, descriptive `<title>`
- [ ] Title format: "Page Name - Application Name"
- [ ] Title updates when navigating (SPA)

### Language
- [ ] `<html lang="en">` attribute set
- [ ] Language changes marked with `lang` attribute

---

## Keyboard Navigation

### Tab Order
- [ ] Tab key moves through interactive elements in logical order
- [ ] Shift+Tab moves backwards correctly
- [ ] No keyboard traps (can tab out of all widgets)
- [ ] Skip link provided to main content
- [ ] Hidden elements not in tab order (`tabindex="-1"` or `display: none`)

### Focus Indicators
- [ ] All interactive elements have visible focus indicator
- [ ] Focus indicator has sufficient contrast (3:1 minimum)
- [ ] Custom focus styles maintain visibility
- [ ] Focus indicator not removed with `outline: none` unless replaced

### Keyboard Shortcuts
- [ ] All functionality available via keyboard
- [ ] Modal dialogs can be closed with Escape
- [ ] Dropdowns can be opened/closed with Enter/Space
- [ ] Lists can be navigated with Arrow keys (if applicable)
- [ ] No keyboard-only users blocked from any feature

---

## Screen Reader Support

### Images
- [ ] All `<img>` tags have `alt` attribute
- [ ] Decorative images have `alt=""` or `role="presentation"`
- [ ] Complex images have detailed descriptions
- [ ] Icons have `aria-label` or are hidden with `aria-hidden="true"`
- [ ] SVGs have `<title>` element or `aria-label`

### Links and Buttons
- [ ] Link text describes destination ("Learn more about..." not just "Click here")
- [ ] Button text describes action ("Save patient" not just "Submit")
- [ ] Links that open new windows/tabs announced (`aria-label` or visible text)
- [ ] External links indicated visually and for screen readers

### Forms
- [ ] All inputs have associated `<label>` with `for` attribute
- [ ] Required fields indicated with `required` or `aria-required="true"`
- [ ] Input purposes use `autocomplete` attribute when appropriate
- [ ] Error messages associated with inputs via `aria-describedby`
- [ ] Error messages have `role="alert"` or `aria-live="polite"`
- [ ] Instructions provided for complex inputs
- [ ] Placeholder text not used as only label

### ARIA Labels
- [ ] Interactive elements without visible labels have `aria-label`
- [ ] Complex widgets have proper ARIA roles
- [ ] Live regions use `aria-live` for dynamic content
- [ ] Modals use `role="dialog"` and `aria-modal="true"`
- [ ] Navigation uses `role="navigation"` and `aria-label`

---

## Visual Design

### Color Contrast
- [ ] Normal text (< 18pt) has 4.5:1 contrast ratio minimum
- [ ] Large text (≥ 18pt or ≥ 14pt bold) has 3:1 contrast ratio minimum
- [ ] UI components have 3:1 contrast ratio minimum
- [ ] Focus indicators have 3:1 contrast ratio minimum
- [ ] Color not used as only means of conveying information

### Text
- [ ] Base font size at least 16px
- [ ] Line height at least 1.5 for body text
- [ ] Paragraph spacing at least 1.5x font size
- [ ] Text can be resized to 200% without loss of functionality
- [ ] No horizontal scrolling at 200% zoom on mobile

### Motion
- [ ] Animations can be disabled with `prefers-reduced-motion`
- [ ] No flashing content (< 3 flashes per second)
- [ ] Parallax and auto-playing videos can be paused
- [ ] Animations don't interfere with functionality

---

## Forms and Interactions

### Form Validation
- [ ] Errors announced to screen readers (`aria-live` or `role="alert"`)
- [ ] Error messages specific and helpful
- [ ] Errors associated with fields via `aria-describedby`
- [ ] Required fields marked before user attempts submission
- [ ] Success messages also announced

### Error Prevention
- [ ] Destructive actions require confirmation
- [ ] Forms can be reviewed before submission
- [ ] Data can be recovered if accidentally deleted
- [ ] Session timeouts warned in advance

### Timing
- [ ] Auto-dismissing content can be paused or extended
- [ ] Time limits can be turned off or extended
- [ ] Users warned before session expires (20 seconds advance)

---

## Mobile and Touch

### Touch Targets
- [ ] All interactive elements at least 44x44px
- [ ] Adequate spacing between touch targets
- [ ] No hover-only interactions
- [ ] Gestures have keyboard alternatives

### Responsive Design
- [ ] Content reflows without horizontal scrolling
- [ ] Text remains readable without zooming
- [ ] All functionality available on mobile
- [ ] Portrait and landscape orientations supported

### Zoom
- [ ] Pinch zoom not disabled
- [ ] `user-scalable=no` not used in viewport meta tag
- [ ] Content readable at 200% zoom
- [ ] Layout doesn't break when zoomed

---

## Dynamic Content

### Loading States
- [ ] Loading states announced to screen readers
- [ ] Skeleton screens or spinners used appropriately
- [ ] Loading doesn't block critical functionality
- [ ] Minimum loading time for skeleton screens (avoid flashing)

### Notifications
- [ ] Toast notifications use `aria-live` regions
- [ ] Error notifications use `aria-live="assertive"`
- [ ] Info notifications use `aria-live="polite"`
- [ ] Notifications can be paused on hover/focus
- [ ] Notifications closeable with keyboard

### Single Page Application (SPA)
- [ ] Page title updates on navigation
- [ ] Focus moved to new content on navigation
- [ ] Browser back button works correctly
- [ ] Loading states between pages announced

---

## Testing Tools

### Automated Testing
Run these tools on every page:

**Browser Extensions:**
- [ ] [axe DevTools](https://www.deque.com/axe/devtools/) - no errors
- [ ] [WAVE](https://wave.webaim.org/extension/) - no errors
- [ ] Lighthouse Accessibility score ≥ 90

**Command Line:**
```bash
# Install Pa11y
npm install --save-dev pa11y

# Run Pa11y on your site
npx pa11y http://localhost:5173
```

### Manual Testing

**Keyboard Testing:**
1. Unplug mouse
2. Navigate entire page with keyboard only
3. Ensure all functionality accessible
4. Check focus indicators visible
5. Test with Tab, Shift+Tab, Enter, Space, Escape, Arrow keys

**Screen Reader Testing:**

**macOS (VoiceOver):**
```
Cmd + F5                # Turn on/off
Ctrl + Option + →/←     # Navigate forward/backward
Ctrl + Option + Space   # Activate element
```

**Windows (NVDA - Free):**
```
Ctrl + Alt + N          # Start NVDA
Insert + Down           # Read next line
Insert + Space          # Activate element
```

**Testing Checklist:**
- [ ] Navigate through all content
- [ ] Activate all interactive elements
- [ ] Fill out forms completely
- [ ] Verify error messages announced
- [ ] Check modal focus behavior
- [ ] Verify loading states announced

---

## Page-Specific Checklists

### Login Page
- [ ] Username/email field properly labeled
- [ ] Password field properly labeled
- [ ] "Show password" toggle accessible
- [ ] Error messages announced
- [ ] "Remember me" checkbox accessible
- [ ] "Forgot password" link descriptive

### Dashboard
- [ ] Page title reflects current view
- [ ] Statistics cards have proper headings
- [ ] Charts have text alternatives
- [ ] Quick actions keyboard accessible
- [ ] Notification area uses live region

### Data Tables
- [ ] Table has proper caption or heading
- [ ] Column headers use `<th>` with `scope="col"`
- [ ] Row headers use `<th>` with `scope="row"` if applicable
- [ ] Sorting functionality keyboard accessible
- [ ] Pagination keyboard accessible
- [ ] Search field properly labeled
- [ ] Action buttons in rows keyboard accessible

### Forms
- [ ] Form has clear heading
- [ ] All fields properly labeled
- [ ] Required fields indicated
- [ ] Help text provided for complex fields
- [ ] Error summary at top of form
- [ ] Errors associated with fields
- [ ] Success message announced
- [ ] Form can be submitted with keyboard

### Modals/Dialogs
- [ ] Modal has `role="dialog"`
- [ ] Modal has `aria-modal="true"`
- [ ] Modal title linked with `aria-labelledby`
- [ ] Focus trapped within modal
- [ ] Focus moves to modal when opened
- [ ] Focus restored when closed
- [ ] Escape key closes modal
- [ ] Close button keyboard accessible
- [ ] Background content inert

---

## Browser Testing

Test in multiple browsers and devices:

**Desktop Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile Browsers:**
- [ ] iOS Safari
- [ ] Chrome Android
- [ ] Samsung Internet

**Screen Readers:**
- [ ] NVDA + Chrome (Windows)
- [ ] JAWS + Chrome (Windows) - if available
- [ ] VoiceOver + Safari (macOS)
- [ ] VoiceOver + Safari (iOS)
- [ ] TalkBack + Chrome (Android)

---

## WCAG 2.1 Level AA Requirements

### Perceivable
- [x] 1.1.1 Non-text Content (Level A)
- [x] 1.2.1 Audio-only and Video-only (Level A)
- [x] 1.2.2 Captions (Level A)
- [x] 1.2.3 Audio Description or Media Alternative (Level A)
- [x] 1.2.4 Captions (Live) (Level AA)
- [x] 1.2.5 Audio Description (Level AA)
- [x] 1.3.1 Info and Relationships (Level A)
- [x] 1.3.2 Meaningful Sequence (Level A)
- [x] 1.3.3 Sensory Characteristics (Level A)
- [x] 1.3.4 Orientation (Level AA)
- [x] 1.3.5 Identify Input Purpose (Level AA)
- [x] 1.4.1 Use of Color (Level A)
- [x] 1.4.2 Audio Control (Level A)
- [x] 1.4.3 Contrast (Minimum) (Level AA)
- [x] 1.4.4 Resize Text (Level AA)
- [x] 1.4.5 Images of Text (Level AA)
- [x] 1.4.10 Reflow (Level AA)
- [x] 1.4.11 Non-text Contrast (Level AA)
- [x] 1.4.12 Text Spacing (Level AA)
- [x] 1.4.13 Content on Hover or Focus (Level AA)

### Operable
- [x] 2.1.1 Keyboard (Level A)
- [x] 2.1.2 No Keyboard Trap (Level A)
- [x] 2.1.4 Character Key Shortcuts (Level A)
- [x] 2.2.1 Timing Adjustable (Level A)
- [x] 2.2.2 Pause, Stop, Hide (Level A)
- [x] 2.3.1 Three Flashes or Below Threshold (Level A)
- [x] 2.4.1 Bypass Blocks (Level A)
- [x] 2.4.2 Page Titled (Level A)
- [x] 2.4.3 Focus Order (Level A)
- [x] 2.4.4 Link Purpose (In Context) (Level A)
- [x] 2.4.5 Multiple Ways (Level AA)
- [x] 2.4.6 Headings and Labels (Level AA)
- [x] 2.4.7 Focus Visible (Level AA)
- [x] 2.5.1 Pointer Gestures (Level A)
- [x] 2.5.2 Pointer Cancellation (Level A)
- [x] 2.5.3 Label in Name (Level A)
- [x] 2.5.4 Motion Actuation (Level A)

### Understandable
- [x] 3.1.1 Language of Page (Level A)
- [x] 3.1.2 Language of Parts (Level AA)
- [x] 3.2.1 On Focus (Level A)
- [x] 3.2.2 On Input (Level A)
- [x] 3.2.3 Consistent Navigation (Level AA)
- [x] 3.2.4 Consistent Identification (Level AA)
- [x] 3.3.1 Error Identification (Level A)
- [x] 3.3.2 Labels or Instructions (Level A)
- [x] 3.3.3 Error Suggestion (Level AA)
- [x] 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)

### Robust
- [x] 4.1.1 Parsing (Level A)
- [x] 4.1.2 Name, Role, Value (Level A)
- [x] 4.1.3 Status Messages (Level AA)

---

## Common Issues and Fixes

### Issue: Focus not visible
**Fix:** Add custom focus styles
```css
:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Issue: Click events on divs
**Fix:** Use button element
```tsx
// Before
<div onClick={handleClick}>Click me</div>

// After
<button onClick={handleClick}>Click me</button>
```

### Issue: Missing form labels
**Fix:** Add label with htmlFor
```tsx
// Before
<input type="text" placeholder="Name" />

// After
<label htmlFor="name">Name</label>
<input type="text" id="name" />
```

### Issue: Icon-only button
**Fix:** Add aria-label
```tsx
<button aria-label="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

### Issue: Color-only indicators
**Fix:** Add text or icons
```tsx
// Before
<span className="text-red-500">●</span>

// After
<span className="text-red-500">
  <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
  Error
</span>
```

---

## Resources

### Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [NVDA (Free, Windows)](https://www.nvaccess.org/)
- [VoiceOver (Built-in, macOS/iOS)](https://www.apple.com/accessibility/voiceover/)
- [JAWS (Paid, Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [TalkBack (Built-in, Android)](https://support.google.com/accessibility/android/answer/6283677)

---

## Sign-off

Page tested: ___________________________

Tester: ___________________________

Date: ___________________________

Results:
- [ ] All automated tests passed
- [ ] Manual keyboard testing passed
- [ ] Screen reader testing passed
- [ ] Mobile testing passed
- [ ] All WCAG 2.1 AA criteria met

Notes:
_________________________________________
_________________________________________
_________________________________________
