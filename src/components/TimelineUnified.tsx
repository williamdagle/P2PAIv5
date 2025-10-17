import React, { useState } from 'react';
import { List, Calendar, Plus, X, Filter } from 'lucide-react';
import TimelineVisualization from './TimelineVisualization';
import DataTable from './DataTable';
import Modal from './Modal';
import TimelineEventFormUnified from './TimelineEventFormUnified';
import ConfirmDialog from './ConfirmDialog';
import Button from './Button';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';

interface TimelineUnifiedProps {
  patientId: string;
  patientName: string;
  showFMFields?: boolean;
  onNavigate?: (page: string) => void;
}

const TimelineUnified: React.FC<TimelineUnifiedProps> = ({
  patientId,
  patientName,
  showFMFields = false,
  onNavigate
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { globals, setGlobal } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();

  React.useEffect(() => {
    loadTimelineEvents();
  }, [patientId, refreshKey, selectedEventTypes]);

  const loadTimelineEvents = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_timeline_events?patient_id=${patientId}`;

      if (selectedEventTypes.length > 0) {
        url += `&event_types=${selectedEventTypes.join(',')}`;
      }

      const data = await apiCall(url, { method: 'GET' });
      setTimelineEvents(data || []);
    } catch (err: any) {
      showError('Failed to load timeline events', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterableEventTypes = [
    'Appointment',
    'Treatment',
    'Clinical Notes',
    'Lab Work',
    'Medication',
    'Supplement'
  ];

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
  };

  const hasActiveFilters = selectedEventTypes.length > 0;

  const buildQueryString = () => {
    let queryString = `patient_id=${patientId}`;
    if (selectedEventTypes.length > 0) {
      queryString += `&event_types=${selectedEventTypes.join(',')}`;
    }
    return queryString;
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event: any) => {
    if (event.source === 'appointment' && onNavigate) {
      setGlobal('pending_appointment_edit', event);
      onNavigate('Appointments');
      return;
    }
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (event: any) => {
    if (event.source === 'appointment' && onNavigate) {
      setGlobal('pending_appointment_edit', event);
      onNavigate('Appointments');
      return;
    }
    setDeletingEvent(event);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_timeline_events`,
        {
          method: 'DELETE',
          body: { id: deletingEvent.id }
        }
      );

      showSuccess('Timeline event deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingEvent(null);
    } catch (err) {
      showError('Failed to delete timeline event', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingEvent ? 'Timeline event updated successfully' : 'Timeline event created successfully'
    );
    setShowForm(false);
    setEditingEvent(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Timeline for {patientName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {showFMFields ? 'Functional Medicine Timeline' : 'Medical Timeline and Events'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {selectedEventTypes.length}
              </span>
            )}
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'visual'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Visual
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </button>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Filter by Event Type</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {filterableEventTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleEventType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedEventTypes.includes(type)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center text-gray-500">Loading timeline events...</div>
        </div>
      ) : (
        <>
          {viewMode === 'visual' ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <TimelineVisualization
                events={timelineEvents}
                onEventClick={handleEdit}
                onAddEvent={handleAddNew}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <DataTable
                key={`${refreshKey}-${buildQueryString()}`}
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_timeline_events?${buildQueryString()}`}
                columns={['event_date', 'event_type', 'title', 'severity']}
                showActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        title={editingEvent ? 'Edit Timeline Event' : 'Add New Timeline Event'}
        size="lg"
      >
        <TimelineEventFormUnified
          timelineEvent={editingEvent}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          showFMFields={showFMFields}
          patientId={patientId}
          clinicId={globals.clinic_id}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Timeline Event"
        message={`Are you sure you want to delete "${deletingEvent?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default TimelineUnified;
