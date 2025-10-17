import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Upload, X } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import Modal from './Modal';
import LabTrendChartEnhanced from './LabTrendChartEnhanced';
import LabTrendResultForm from './LabTrendResultForm';
import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';

const LabTrendsSection: React.FC = () => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();

  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingResult, setDeletingResult] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedMarker, setSelectedMarker] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    if (globals.selected_patient_id) {
      loadData();
    }
  }, [globals.selected_patient_id, selectedMarker, selectedCategory, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resultsData, categoriesData, markersData] = await Promise.all([
        apiCall(buildResultsUrl()),
        apiCall(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_lab_categories`),
        apiCall(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_lab_marker_metadata`),
      ]);

      // Transform labs data to match expected format
      const transformedResults = (resultsData || []).map((lab: any) => ({
        id: lab.id,
        lab_marker: lab.lab_name,
        result_value: lab.result_value || parseFloat(lab.result) || 0,
        unit: lab.unit || '',
        result_date: lab.result_date,
        source: lab.source || 'Manual Entry',
        conventional_range_low: lab.conventional_range_low,
        conventional_range_high: lab.conventional_range_high,
        functional_range_low: lab.functional_range_low,
        functional_range_high: lab.functional_range_high,
        zone: lab.zone,
        note: lab.note,
      }));

      setResults(transformedResults);
      setCategories(categoriesData || []);
      setMarkers(markersData || []);
    } catch (err) {
      showError('Failed to load lab trends', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildResultsUrl = () => {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_labs?patient_id=${globals.selected_patient_id}`;
  };

  const handleFormSuccess = () => {
    setShowAddModal(false);
    setEditingResult(null);
    loadData();
  };

  const handleEdit = (result: any) => {
    setEditingResult(result);
    setShowAddModal(true);
  };

  const handleDelete = (result: any) => {
    setDeletingResult(result);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_labs?id=${deletingResult.id}`,
        { method: 'DELETE' }
      );

      showSuccess('Lab result deleted successfully');
      setShowDeleteDialog(false);
      setDeletingResult(null);
      loadData();
    } catch (err) {
      showError('Failed to delete lab result', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedMarker('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
  };

  // Client-side filtering
  const filteredResults = results.filter((result) => {
    if (selectedMarker && result.lab_marker !== selectedMarker) return false;
    if (startDate && result.result_date < startDate) return false;
    if (endDate && result.result_date > endDate) return false;

    // Category filtering
    if (selectedCategory) {
      const marker = markers.find((m) => m.marker_name === result.lab_marker);
      if (!marker || marker.lab_categories?.name !== selectedCategory) return false;
    }

    return true;
  });

  const uniqueMarkers = Array.from(new Set(filteredResults.map((r) => r.lab_marker))).sort();

  const groupedResults = uniqueMarkers.reduce((acc, marker) => {
    acc[marker] = filteredResults.filter((r) => r.lab_marker === marker);
    return acc;
  }, {} as Record<string, any[]>);

  if (!globals.selected_patient_id) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">Please select a patient to view lab trends</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lab Trends</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track lab markers over time with functional medicine ranges
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Lab Result
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {(selectedMarker || selectedCategory || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedMarker('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Marker</label>
            <select
              value={selectedMarker}
              onChange={(e) => setSelectedMarker(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Markers</option>
              {uniqueMarkers.map((marker) => (
                <option key={marker} value={marker}>
                  {marker}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'chart'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chart View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'table'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Loading lab trends...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No lab results found</p>
          <p className="text-sm text-gray-500 mt-1">
            Add lab results to start tracking trends
          </p>
        </div>
      ) : viewMode === 'chart' ? (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([marker, markerResults]) => (
            <div key={marker} className="bg-white rounded-lg border border-gray-200 p-6">
              <LabTrendChartEnhanced
                results={markerResults}
                marker_name={marker}
                unit={markerResults[0].unit}
                showLegend={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            apiUrl={buildResultsUrl()}
            columns={['lab_marker', 'result_value', 'unit', 'result_date', 'zone', 'source']}
            showActions={true}
            searchable={true}
            searchPlaceholder="Search lab results..."
            onEdit={handleEdit}
            onDelete={handleDelete}
            customRenderers={{
              result_date: (value: any) => new Date(value).toLocaleDateString(),
              result_value: (value: any) => parseFloat(value).toFixed(2),
              zone: (value: any) => {
                const colors = {
                  optimal: 'bg-green-100 text-green-800',
                  functional_deviation: 'bg-yellow-100 text-yellow-800',
                  abnormal: 'bg-red-100 text-red-800',
                };
                const labels = {
                  optimal: 'Optimal',
                  functional_deviation: 'Functional Deviation',
                  abnormal: 'Abnormal',
                };
                return (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${colors[value as keyof typeof colors]}`}>
                    {labels[value as keyof typeof labels]}
                  </span>
                );
              },
            }}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingResult(null);
        }}
        title={editingResult ? 'Edit Lab Result' : 'Add Lab Result'}
        size="lg"
      >
        <LabTrendResultForm
          result={editingResult}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowAddModal(false);
            setEditingResult(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Lab Result"
        message={`Are you sure you want to delete this ${deletingResult?.lab_marker} result from ${
          deletingResult?.result_date ? new Date(deletingResult.result_date).toLocaleDateString() : ''
        }? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default LabTrendsSection;
