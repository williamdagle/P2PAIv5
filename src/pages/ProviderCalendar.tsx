import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiWithCircuitBreaker } from '../hooks/useApiWithCircuitBreaker';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { validateDataClinicIds, filterDataByClinic } from '../utils/patientLookup';
import Button from '../components/Button';
import FormField from '../components/FormField';
import ApiErrorBoundary from '../components/ApiErrorBoundary';
import DayView from '../components/calendar/DayView';
import ThreeDayView from '../components/calendar/ThreeDayView';
import WeekView from '../components/calendar/WeekView';
import MonthView from '../components/calendar/MonthView';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Building2 } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  status: string;
  patient_name: string;
}

interface Provider {
  id: string;
  full_name: string;
  email: string;
  clinic_id: string;
}

const ProviderCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicInfo, setClinicInfo] = useState<{ name: string; clinic_type: string } | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [providersError, setProvidersError] = useState<string>('');
  const [clinicError, setClinicError] = useState<string>('');
  const [appointmentsError, setAppointmentsError] = useState<string>('');
  const [calendarView, setCalendarView] = useState<'list' | 'day' | 'three-day' | 'week' | 'month'>('day');
  
  // Use refs to track what we've already loaded to prevent infinite loops
  const providersLoaded = useRef(false);
  const clinicLoaded = useRef(false);
  const lastAppointmentQuery = useRef<string>('');
  
  const { apiCall, resetCircuitBreaker } = useApiWithCircuitBreaker();
  const { globals } = useGlobal();

  // Load providers once on mount
  useEffect(() => {
    if (!globals.clinic_id || providersLoaded.current || loadingProviders) {
      return;
    }

    console.log('🏥 ProviderCalendar loading providers for clinic:', globals.clinic_id);

    const fetchProviders = async () => {
      setLoadingProviders(true);
      setProvidersError('');
      providersLoaded.current = true; // Mark as attempted immediately

      try {
        console.log('📡 Fetching providers from get_users...');
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
          { method: 'GET' }
        );

        console.log('📨 Providers response received:', typeof response);

        // Handle both array and object responses
        const users = Array.isArray(response) ? response : response.users || [];

        console.log('🔍 Debug ProviderCalendar - All users:', {
          totalUsers: users.length,
          currentClinicId: globals.clinic_id,
          usersWithClinicId: users.filter((u: any) => u.clinic_id).length,
          userClinicIds: [...new Set(users.map((u: any) => u.clinic_id))],
          usersInCurrentClinic: users.filter((u: any) => u.clinic_id === globals.clinic_id).length
        });

        if (users.length > 0) {
          // Validate clinic_id presence
          validateDataClinicIds(users, 'ProviderCalendar');

          // Filter providers by clinic
          const clinicProviders = filterDataByClinic(users, globals.clinic_id, 'ProviderCalendar');

          console.log('🏥 Debug ProviderCalendar - Clinic providers:', {
            totalProviders: clinicProviders.length,
            providerNames: clinicProviders.map((p: any) => p.full_name),
            allUserClinicIds: users.map((u: any) => u.clinic_id),
            expectedClinicId: globals.clinic_id,
            mismatchedUsers: users.filter((u: any) => u.clinic_id !== globals.clinic_id).length
          });

          setProviders(clinicProviders);

          // Set default provider to current logged-in user
          if (clinicProviders.length > 0 && globals.user_id && !selectedProvider) {
            const currentUser = clinicProviders.find((p: any) => p.auth_user_id === globals.user_id);
            if (currentUser) {
              console.log('👤 Setting default provider to current user:', currentUser.full_name);
              setSelectedProvider(currentUser.id);
            }
          }

          if (clinicProviders.length === 0) {
            const mismatchedCount = users.filter((u: any) => u.clinic_id !== globals.clinic_id).length;
            setProvidersError(
              `No providers found for clinic ${globals.clinic_id}. ` +
              `Found ${users.length} total users, ${mismatchedCount} from different clinics. ` +
              `This suggests RLS filtering may not be working correctly.`
            );
          }
        } else {
          setProvidersError('No user data received from the API.');
          setProviders([]);
        }
      } catch (err) {
        console.error('❌ Provider fetch error:', err);
        setProvidersError(err instanceof Error ? err.message : 'Failed to load providers');
        setProviders([]);
        providersLoaded.current = false; // Allow retry on error
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [globals.clinic_id, globals.user_id, apiCall]); // Added globals.user_id to dependencies

  // Load clinic information once on mount
  useEffect(() => {
    if (!globals.clinic_id || clinicLoaded.current || loadingClinic) {
      return;
    }
    
    const fetchClinicInfo = async () => {
      setLoadingClinic(true);
      setClinicError('');
      clinicLoaded.current = true; // Mark as attempted immediately
      
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_clinics`,
          { method: 'GET' }
        );
        
        // Handle both array and object responses
        const clinics = Array.isArray(response) ? response : response.clinics || [];
        
        console.log('🔍 Debug ProviderCalendar - All clinics:', {
          totalClinics: clinics.length,
          currentClinicId: globals.clinic_id,
          clinicIds: clinics.map((c: any) => c.id)
        });
        
        if (clinics.length > 0) {
          const currentClinic = clinics.find((clinic: any) => clinic.id === globals.clinic_id);
          if (currentClinic) {
            setClinicInfo({ name: currentClinic.name, clinic_type: currentClinic.clinic_type });
            console.log('✅ Found current clinic:', currentClinic.name);
          } else {
            setClinicError(`Current clinic ${globals.clinic_id} not found in ${clinics.length} available clinics`);
          }
        } else {
          setClinicError('No clinic data received from the API.');
        }
      } catch (err) {
        setClinicError(err instanceof Error ? err.message : 'Failed to load clinic information');
        clinicLoaded.current = false; // Allow retry on error
      } finally {
        setLoadingClinic(false);
      }
    };

    fetchClinicInfo();
  }, [globals.clinic_id, apiCall]); // Added apiCall back to dependencies

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (calendarView) {
      case 'three-day':
        end.setDate(end.getDate() + 2);
        break;
      case 'week':
        const startDay = start.getDay();
        start.setDate(start.getDate() - startDay);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }

    return { start, end };
  };

  const fetchAppointments = useCallback(async (providerId: string, date: string) => {
    const queryKey = `${providerId}-${date}-${calendarView}`;

    if (lastAppointmentQuery.current === queryKey || loadingAppointments) {
      console.log('🔄 Skipping duplicate appointment query:', queryKey);
      return;
    }

    console.log('📅 Fetching appointments for:', queryKey);
    lastAppointmentQuery.current = queryKey;
    setLoadingAppointments(true);
    setAppointmentsError('');

    try {
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_appointments?provider_id=${providerId}`;

      if (calendarView === 'list' || calendarView === 'day') {
        url += `&date=${date}`;
      } else {
        const { start, end } = getDateRange();
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        url += `&start_date=${startStr}&end_date=${endStr}`;
      }

      const response = await apiCall<any>(url, { method: 'GET' });
      
      console.log('🔍 Debug ProviderCalendar - Appointments response:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasAppointments: !!response.appointments,
        keys: Object.keys(response || {})
      });
      
      // Handle both array and object responses
      const appointments = Array.isArray(response) ? response : response.appointments || [];
      
      console.log('🔍 Debug ProviderCalendar - Appointments data:', {
        totalAppointments: appointments.length,
        appointmentsWithClinicId: appointments.filter((a: any) => a.clinic_id).length,
        appointmentClinicIds: [...new Set(appointments.map((a: any) => a.clinic_id))],
        currentClinicId: globals.clinic_id
      });
      
      if (appointments.length > 0) {
        // Validate clinic_id presence
        validateDataClinicIds(appointments, 'ProviderCalendar');
        
        // Filter by clinic (though RLS should handle this)
        const clinicAppointments = filterDataByClinic(appointments, globals.clinic_id, 'ProviderCalendar');
        
        const sortedAppointments = clinicAppointments.sort((a: Appointment, b: Appointment) => {
          return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
        });
        
        setAppointments(sortedAppointments);
        console.log('✅ Appointments loaded and filtered:', sortedAppointments.length);
      } else {
        setAppointments([]);
        console.log('📅 No appointments found for provider on date');
      }
    } catch (err) {
      console.error('❌ Appointment fetch error:', err);
      setAppointmentsError(err instanceof Error ? err.message : 'Failed to load appointments');
      setAppointments([]);
      lastAppointmentQuery.current = ''; // Allow retry on error
    } finally {
      setLoadingAppointments(false);
    }
  }, [apiCall, globals.clinic_id, loadingAppointments, calendarView, selectedDate]);

  // Load appointments when provider or date changes
  useEffect(() => {
    if (!selectedProvider || !selectedDate) {
      setAppointments([]);
      setAppointmentsError('');
      lastAppointmentQuery.current = '';
      return;
    }

    // Validate that selected provider belongs to current user's clinic
    const selectedProviderData = providers.find(p => p.id === selectedProvider);
    if (!selectedProviderData) {
      console.log('⚠️ Selected provider not found in providers list');
      setAppointments([]);
      setAppointmentsError('Selected provider not found');
      lastAppointmentQuery.current = '';
      return;
    }

    if (selectedProviderData.clinic_id !== globals.clinic_id) {
      console.log('⚠️ Provider not in current clinic, clearing selection');
      setSelectedProvider('');
      setAppointments([]);
      setAppointmentsError('Provider not in current clinic');
      lastAppointmentQuery.current = '';
      return;
    }

    // Fetch appointments for valid provider
    console.log('📅 Fetching appointments for valid provider:', {
      providerId: selectedProvider,
      providerName: selectedProviderData.full_name,
      date: selectedDate,
      clinicId: selectedProviderData.clinic_id
    });
    
    fetchAppointments(selectedProvider, selectedDate);
  }, [selectedProvider, selectedDate, providers, globals.clinic_id, fetchAppointments, calendarView]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    // Parse the date string as local date to avoid timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split('T')[0];
    setSelectedDate(newDate);
    lastAppointmentQuery.current = '';
  };

  const navigateByView = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    let increment = 0;

    switch (calendarView) {
      case 'list':
      case 'day':
        increment = direction === 'next' ? 1 : -1;
        break;
      case 'three-day':
        increment = direction === 'next' ? 3 : -3;
        break;
      case 'week':
        increment = direction === 'next' ? 7 : -7;
        break;
      case 'month':
        if (direction === 'next') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setMonth(currentDate.getMonth() - 1);
        }
        setSelectedDate(currentDate.toISOString().split('T')[0]);
        lastAppointmentQuery.current = '';
        return;
    }

    currentDate.setDate(currentDate.getDate() + increment);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
    lastAppointmentQuery.current = '';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProviderChange = (providerId: string) => {
    console.log('👤 Provider changed to:', providerId);
    setSelectedProvider(providerId);
    setAppointments([]); // Clear appointments when changing provider
    setAppointmentsError(''); // Clear any previous errors
    lastAppointmentQuery.current = ''; // Reset query tracking
  };

  const retryProviders = () => {
    console.log('🔄 Retrying providers...');
    resetCircuitBreaker('get_users');
    providersLoaded.current = false;
    setProvidersError('');
    setProviders([]);
  };

  const retryClinic = () => {
    console.log('🔄 Retrying clinic...');
    resetCircuitBreaker('get_clinics');
    clinicLoaded.current = false;
    setClinicError('');
    setClinicInfo(null);
  };

  const retryAppointments = () => {
    console.log('🔄 Retrying appointments...');
    resetCircuitBreaker('get_appointments');
    lastAppointmentQuery.current = '';
    setAppointmentsError('');
    setAppointments([]);
    if (selectedProvider && selectedDate) {
      fetchAppointments(selectedProvider, selectedDate);
    }
  };

  const selectedProviderName = providers.find(p => p.id === selectedProvider)?.full_name || '';

  return (
    <div>
      <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Calendar</h1>
              <p className="text-gray-600">View provider schedules and appointments</p>
            </div>
            <ApiErrorBoundary
              error={clinicError}
              loading={loadingClinic}
              onRetry={retryClinic}
              functionName="get_clinics"
            >
              {clinicInfo && (
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span>Current Clinic</span>
                  </div>
                  <p className="font-medium text-gray-900">{clinicInfo.name}</p>
                  <p className="text-sm text-gray-600">{clinicInfo.clinic_type}</p>
                </div>
              )}
            </ApiErrorBoundary>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ApiErrorBoundary
            error={providersError}
            loading={loadingProviders}
            onRetry={retryProviders}
            functionName="get_users"
            showFunctionHelp={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <FormField label="Select Date">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => navigateByView('prev')}
                      className="p-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        lastAppointmentQuery.current = '';
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => navigateByView('next')}
                      className="p-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </FormField>
              </div>

              {/* Provider Selection */}
              <div>
                <FormField label="Select Provider">
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingProviders || !!providersError}
                  >
                    <option value="">
                      {loadingProviders ? 'Loading providers...' : 'Select a provider'}
                    </option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.full_name} ({provider.email})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </ApiErrorBoundary>
        </div>

        {/* Calendar Display */}
        {selectedProvider && selectedDate && (
          <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedProviderName}
                    </h2>
                    <p className="text-gray-600">{formatDate(selectedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setCalendarView('list')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        calendarView === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setCalendarView('day')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        calendarView === 'day'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setCalendarView('three-day')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        calendarView === 'three-day'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      3-Day
                    </button>
                    <button
                      onClick={() => setCalendarView('week')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        calendarView === 'week'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarView('month')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        calendarView === 'month'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Appointments</p>
                    <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Display */}
            <div className={calendarView === 'list' ? 'p-6' : ''}>
              <ApiErrorBoundary
                error={appointmentsError}
                loading={loadingAppointments}
                onRetry={retryAppointments}
                functionName="get_appointments"
                showFunctionHelp={true}
              >
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</p>
                    <p className="text-gray-600">This provider has no appointments for the selected date.</p>
                  </div>
                ) : calendarView === 'list' ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900">
                                  {formatTime(appointment.appointment_date)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{appointment.patient_name}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-1">
                              <strong>Reason:</strong> {appointment.reason}
                            </p>
                            <p className="text-sm text-gray-500">
                              Duration: {appointment.duration_minutes} minutes
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : calendarView === 'day' ? (
                  <DayView
                    appointments={appointments}
                    selectedDate={selectedDate}
                  />
                ) : calendarView === 'three-day' ? (
                  <ThreeDayView
                    appointments={appointments}
                    startDate={selectedDate}
                  />
                ) : calendarView === 'week' ? (
                  <WeekView
                    appointments={appointments}
                    startDate={selectedDate}
                  />
                ) : calendarView === 'month' ? (
                  <MonthView
                    appointments={appointments}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setCalendarView('day');
                    }}
                  />
                ) : null}
              </ApiErrorBoundary>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedProvider && !providersError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Calendar className="w-6 h-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Getting Started</h3>
                {clinicInfo && (
                  <p className="text-sm text-blue-800 mb-2">
                    Viewing providers for: <strong>{clinicInfo.name}</strong>
                  </p>
                )}
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Select a date using the date picker or navigation arrows</li>
                  <li>• Choose a provider from the dropdown menu</li>
                  <li>• View all appointments scheduled for that provider on the selected date</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default ProviderCalendar;
