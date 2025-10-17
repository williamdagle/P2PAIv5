# Quick Start Examples

This guide provides copy-paste ready examples for integrating the enhanced components.

## Example 1: Update Dashboard Page

### Before
```tsx
// src/pages/Dashboard.tsx
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';

const Dashboard = ({ onNavigate }) => {
  return (
    <Layout>
      <Sidebar currentPage="Dashboard" onPageChange={onNavigate} />
      <div>
        <h1>Dashboard</h1>
        {/* content */}
      </div>
    </Layout>
  );
};
```

### After
```tsx
// src/pages/Dashboard.tsx
import Layout from '../components/Layout';
import SidebarEnhanced from '../components/SidebarEnhanced';

const Dashboard = ({ onNavigate }) => {
  return (
    <Layout>
      <SidebarEnhanced currentPage="Dashboard" onPageChange={onNavigate} />
      <div>
        <h1>Dashboard</h1>
        {/* content */}
      </div>
    </Layout>
  );
};
```

**That's it!** The enhanced sidebar is a drop-in replacement.

---

## Example 2: Add Loading Skeleton to Patients List

### Before
```tsx
// src/pages/Patients.tsx
const Patients = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable data={patients} />
      )}
    </div>
  );
};
```

### After
```tsx
// src/pages/Patients.tsx
import { TableSkeleton } from '../components/LoadingSkeleton';

const Patients = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  return (
    <div>
      {loading ? (
        <TableSkeleton rows={10} columns={4} />
      ) : (
        <DataTable data={patients} />
      )}
    </div>
  );
};
```

**Result:** Professional skeleton screen instead of plain "Loading..." text.

---

## Example 3: Enhance Patient Form Modal

### Before
```tsx
// src/pages/Patients.tsx
import Modal from '../components/Modal';
import FormField from '../components/FormField';

const Patients = () => {
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  return (
    <>
      <Button onClick={() => setShowForm(true)}>
        Add Patient
      </Button>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Patient"
      >
        <form>
          <FormField label="First Name" error={errors.firstName} required>
            <input type="text" />
          </FormField>

          <FormField label="Last Name" error={errors.lastName} required>
            <input type="text" />
          </FormField>

          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </>
  );
};
```

### After
```tsx
// src/pages/Patients.tsx
import ModalEnhanced from '../components/ModalEnhanced';
import FormFieldEnhanced from '../components/FormFieldEnhanced';

const Patients = () => {
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  return (
    <>
      <Button
        onClick={() => setShowForm(true)}
        ariaLabel="Add new patient to system"
      >
        Add Patient
      </Button>

      <ModalEnhanced
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Patient"
        size="lg"
      >
        <form>
          <FormFieldEnhanced
            label="First Name"
            error={errors.firstName}
            required
            helpText="Patient's legal first name"
          >
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormFieldEnhanced>

          <FormFieldEnhanced
            label="Last Name"
            error={errors.lastName}
            required
            helpText="Patient's legal last name"
          >
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormFieldEnhanced>

          <Button type="submit">Save Patient</Button>
        </form>
      </ModalEnhanced>
    </>
  );
};
```

**Benefits:**
- Modal traps focus for keyboard users
- Form fields have proper ARIA labels
- Help text provides guidance
- Screen readers announce errors
- Escape key closes modal

---

## Example 4: Improve Notifications

### Before
```tsx
// src/pages/Patients.tsx
import { useNotification } from '../hooks/useNotification';

const Patients = () => {
  const { showSuccess } = useNotification();

  const savePatient = async () => {
    await api.savePatient(data);
    showSuccess('Patient saved');
  };

  return (/* ... */);
};
```

### After
```tsx
// src/pages/Patients.tsx
import { useNotification } from '../hooks/useNotification';

const Patients = () => {
  const { showSuccess } = useNotification();

  const savePatient = async (patientData) => {
    const result = await api.savePatient(patientData);
    showSuccess(
      'Patient saved successfully',
      `${patientData.firstName} ${patientData.lastName} has been added to the system`,
      {
        action: {
          label: 'View Patient',
          onClick: () => navigate(`/patients/${result.id}`)
        }
      }
    );
  };

  return (/* ... */);
};
```

**Result:** More informative notifications with action buttons.

---

## Example 5: Loading State for Dashboard Cards

### Before
```tsx
// src/pages/Dashboard.tsx
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <div>
      {loading ? (
        <div>Loading stats...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <StatsCard title="Total Patients" value={stats.patients} />
          <StatsCard title="Appointments Today" value={stats.appointments} />
          <StatsCard title="Pending Tasks" value={stats.tasks} />
        </div>
      )}
    </div>
  );
};
```

### After
```tsx
// src/pages/Dashboard.tsx
import { CardSkeleton } from '../components/LoadingSkeleton';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <div>
      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Patients" value={stats.patients} />
          <StatsCard title="Appointments Today" value={stats.appointments} />
          <StatsCard title="Pending Tasks" value={stats.tasks} />
        </div>
      )}
    </div>
  );
};
```

**Result:** Professional card skeletons that match the actual layout.

---

## Example 6: Complete Page with All Enhancements

Here's a complete example showing all enhanced components working together:

```tsx
// src/pages/Patients.tsx
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import SidebarEnhanced from '../components/SidebarEnhanced';
import ModalEnhanced from '../components/ModalEnhanced';
import FormFieldEnhanced from '../components/FormFieldEnhanced';
import Button from '../components/Button';
import { TableSkeleton } from '../components/LoadingSkeleton';
import DataTable from '../components/DataTable';
import { Plus } from 'lucide-react';

interface PatientsProps {
  onNavigate: (page: string) => void;
}

const Patients: React.FC<PatientsProps> = ({ onNavigate }) => {
  const { setGlobal } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      showError('Failed to load patients', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const newPatient = await api.createPatient(formData);
      setPatients([...patients, newPatient]);
      setShowForm(false);
      showSuccess(
        'Patient created successfully',
        `${formData.firstName} ${formData.lastName} has been added`,
        {
          action: {
            label: 'View Patient',
            onClick: () => {
              setGlobal('selected_patient_id', newPatient.id);
              setGlobal('selected_patient_name', `${formData.firstName} ${formData.lastName}`);
              onNavigate('PatientChart');
            }
          }
        }
      );
      setFormData({ firstName: '', lastName: '', dob: '', email: '' });
    } catch (error) {
      showError('Failed to create patient', error.message);
    }
  };

  const handleRowClick = (patient: Patient) => {
    setGlobal('selected_patient_id', patient.id);
    setGlobal('selected_patient_name', `${patient.firstName} ${patient.lastName}`);
    onNavigate('PatientChart');
  };

  return (
    <Layout>
      <SidebarEnhanced currentPage="Patients" onPageChange={onNavigate} />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patients</h1>
            <p className="text-gray-600">Manage patient records and information</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            ariaLabel="Create new patient record"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Add Patient
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <TableSkeleton rows={10} columns={4} />
          ) : (
            <DataTable
              data={patients}
              columns={['firstName', 'lastName', 'dob', 'email']}
              onRowClick={handleRowClick}
              searchable
              searchPlaceholder="Search patients by name, date of birth, or email..."
            />
          )}
        </div>

        <ModalEnhanced
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Add New Patient"
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <FormFieldEnhanced
              label="First Name"
              error={errors.firstName}
              required
              helpText="Patient's legal first name"
            >
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormFieldEnhanced>

            <FormFieldEnhanced
              label="Last Name"
              error={errors.lastName}
              required
              helpText="Patient's legal last name"
            >
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormFieldEnhanced>

            <FormFieldEnhanced
              label="Date of Birth"
              error={errors.dob}
              required
            >
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormFieldEnhanced>

            <FormFieldEnhanced
              label="Email"
              error={errors.email}
              helpText="Patient's contact email address"
            >
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormFieldEnhanced>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
                ariaLabel="Cancel and close form"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                ariaLabel="Save patient record"
              >
                Save Patient
              </Button>
            </div>
          </form>
        </ModalEnhanced>
      </div>
    </Layout>
  );
};

export default Patients;
```

This complete example demonstrates:
- ✅ Enhanced responsive sidebar
- ✅ Accessible modal with focus trap
- ✅ Form fields with proper ARIA labels
- ✅ Loading skeletons for better UX
- ✅ Notifications with actions
- ✅ Keyboard navigation throughout
- ✅ Screen reader support
- ✅ Mobile responsive design

---

## Testing Your Changes

### Quick Test Checklist

1. **Visual Test**
   ```
   npm run dev
   ```
   - Open http://localhost:5173
   - Click around to ensure everything works

2. **Keyboard Test**
   - Tab through all elements
   - Press Escape to close modals
   - Use Enter/Space to activate buttons

3. **Mobile Test**
   - Resize browser to mobile size
   - Click hamburger menu
   - Try all interactions

4. **Screen Reader Test** (Mac)
   ```
   Cmd + F5  # Enable VoiceOver
   ```
   - Navigate with VoiceOver
   - Verify all elements are announced

5. **Build Test**
   ```
   npm run build
   ```
   - Ensure no errors

---

## Common Patterns

### Pattern: Loading State
```tsx
const [loading, setLoading] = useState(true);

{loading ? <LoadingSkeleton variant="text" count={3} /> : <Content />}
```

### Pattern: Form with Validation
```tsx
<FormFieldEnhanced label="Email" error={errors.email} required>
  <input type="email" {...props} />
</FormFieldEnhanced>
```

### Pattern: Modal Dialog
```tsx
<ModalEnhanced isOpen={show} onClose={() => setShow(false)} title="Title">
  <Content />
</ModalEnhanced>
```

### Pattern: Success Notification
```tsx
showSuccess('Title', 'Message', {
  action: { label: 'Undo', onClick: handleUndo }
});
```

---

## Tips

### Tip 1: Start Small
Begin with one page, test thoroughly, then expand.

### Tip 2: Use TypeScript
Let TypeScript guide you - if it compiles, it's probably correct.

### Tip 3: Test Accessibility Early
Don't wait until the end - test with keyboard and screen reader as you go.

### Tip 4: Mobile First
Always test mobile view first, then scale up.

### Tip 5: Ask for Feedback
Get real users to test the interface - they'll find issues you missed.

---

## Need Help?

- Check the main documentation: `UI-UX-IMPROVEMENTS.md`
- Review the implementation guide: `IMPLEMENTATION-GUIDE.md`
- Look at component source code for examples
- Test with browser DevTools and accessibility tools

---

## Summary

With these enhanced components, you can quickly:
- ✅ Add accessibility to any page
- ✅ Implement responsive mobile design
- ✅ Create professional loading states
- ✅ Build accessible forms and modals
- ✅ Provide better user feedback

All while maintaining type safety and code quality!
