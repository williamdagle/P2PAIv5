import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TimelineEventForm from '../components/TimelineEventForm';
import Button from '../components/Button';
import { Plus, X } from 'lucide-react';

const TimelineEvents: React.FC = () => {
  const navigate = useNavigate();
  const { globals, setGlobal } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAddNew = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event: any) => {
    if (event.source === 'appointment') {
      // Store the appointment data and navigate to Appointments page
      setGlobal('pending_appointment_edit', event);
      navigate('/appointments');
      return;
    }
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (event: any) => {
    if (event.source === 'appointment') {
      // Store the appointment data and navigate to Appointments page
      setGlobal('pending_appointment_edit', event);
      navigate('/appointments');
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

  const eventTypes = [
    'Symptom',
    'Treatment',
    'Lab Work',
    'Appointment',
    'Lifestyle Change',
    'Supplement',
    'Medication',
    'Other'
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
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = selectedEventTypes.length > 0 || startDate || endDate;

  // Build query string with filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('patient_id', globals.selected_patient_id);

    if (selectedEventTypes.length > 0) {
      params.append('event_types', selectedEventTypes.join(','));
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }

    return params.toString();
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Timeline Events for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Medical history and significant events timeline</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Timeline Event
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Event Type Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Types
              </label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedEventTypes.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
      </div>

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

        {/* Timeline Event Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingEvent ? 'Edit Timeline Event' : 'Add New Timeline Event'}
          size="lg"
        >
          <TimelineEventForm
            timelineEvent={editingEvent}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
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

export default TimelineEvents;
