# Organization Data Sharing - Feature Migration

## Summary
Moved the Organization Data Sharing setting from the Admin page to the System Settings page (Features tab) for better organization and accessibility.

## Changes Made

### 1. SystemSettings.tsx (`/system-settings`)
**Added:**
- New state variables for organizations:
  - `organizations` - stores list of organizations
  - `orgRefreshKey` - triggers refresh when sharing is toggled
- New function `loadOrganizations()` - fetches organizations from API
- New function `handleToggleOrgSharing()` - updates organization sharing setting with:
  - **Optimistic UI updates** - toggles respond immediately for better UX
  - **Error recovery** - reverts state if API call fails
  - **User feedback** - success/error notifications
- Separate useEffect hooks for better performance:
  - Initial load (user role, settings) - runs once
  - Organization reload (only when orgRefreshKey changes)
- New UI section in Features tab:
  - Section title with Share2 icon
  - Description of data sharing feature
  - **Fully interactive toggle switches** for each organization
  - Each organization shows: name, org_id, and enable/disable toggle
  - Real-time state updates with smooth UX

**Location:** Features tab (bottom section, after all feature toggles)

**Styling:**
- Purple accent color (matches organization theme)
- Cards with white background and gray borders
- Toggle switches with purple accent when enabled

**Functionality:**
- ✅ Click toggle to immediately enable/disable data sharing
- ✅ Changes persist to database via API
- ✅ Success notification on save
- ✅ Error notification with automatic rollback on failure

### 2. Admin.tsx (`/admin`)
**Removed:**
- Entire "Organizations" section (lines 219-270)
- `orgRefreshKey` state variable
- `Share2` icon import
- DataTable showing organizations with inline toggles

**Kept:**
- Users management section
- Clinics management section
- All existing admin functionality

## Why This Change?

### Better Organization
- System Settings is the central place for system-wide configurations
- Features tab already contains other feature toggles
- Reduces clutter in Admin page

### Improved User Experience
- All feature toggles are now in one place
- More intuitive navigation path
- Consistent with similar settings

### Clearer Purpose
- Admin page focuses on user and clinic management
- System Settings focuses on system-wide configurations
- Organization data sharing is a system-wide feature, not an administrative task

## Migration Path

No database changes required. The feature continues to use:
- `get_organizations` edge function
- `update_organizations` edge function
- `enable_data_sharing` column in organizations table

## Testing Checklist

- [ ] Navigate to System Settings → Features tab
- [ ] Verify Organizations section appears at bottom
- [ ] Toggle organization data sharing on/off
- [ ] Verify changes persist after page refresh
- [ ] Confirm Admin page no longer shows Organizations section
- [ ] Verify Admin page still shows Users and Clinics sections

## Navigation Path

**Old:** Dashboard → Admin → Organizations section
**New:** Dashboard → System Settings → Features tab → Organization Data Sharing section
