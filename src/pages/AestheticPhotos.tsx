import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from '../components/Button';
import Modal from '../components/Modal';
import AestheticPhotoUploadForm from '../components/AestheticPhotoUploadForm';
import { Camera, Plus, X, Calendar, Eye, Download, Trash2, ArrowLeftRight } from 'lucide-react';

const AestheticPhotos: React.FC = () => {
  const navigate = useNavigate();
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<any>(null);
  const [afterPhoto, setAfterPhoto] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('All');

  useEffect(() => {
    if (globals.selected_patient_id) {
      loadPhotos();
    }
  }, [globals.selected_patient_id]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await apiCall('get_aesthetic_photos', 'POST', {
        patient_id: globals.selected_patient_id,
      });
      setPhotos(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await apiCall('delete_aesthetic_photo', 'POST', { id });
      showSuccess('Photo deleted successfully');
      loadPhotos();
    } catch (error: any) {
      showError(error.message || 'Failed to delete photo');
    }
  };

  const handleView = (photo: any) => {
    setSelectedPhoto(photo);
    setShowViewModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadPhotos();
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setBeforePhoto(null);
    setAfterPhoto(null);
  };

  const handlePhotoSelect = (photo: any) => {
    if (!compareMode) {
      handleView(photo);
      return;
    }

    if (!beforePhoto) {
      setBeforePhoto(photo);
    } else if (!afterPhoto) {
      setAfterPhoto(photo);
    } else {
      setBeforePhoto(photo);
      setAfterPhoto(null);
    }
  };

  if (!globals.selected_patient_id) {
    return (
      
        
        <div className="text-center py-12">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Patient Selected</h2>
          <p className="text-gray-600 mb-6">Please select a patient to view photos</p>
          <Button onClick={() => navigate('/patients')}>
            Select Patient
          </Button>
        </div>
      
    );
  }

  const filteredPhotos = filterType === 'All'
    ? photos
    : photos.filter((p) => p.photo_type === filterType);

  const photoTypes = ['All', ...Array.from(new Set(photos.map((p) => p.photo_type)))];

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Camera className="w-8 h-8 mr-3 text-blue-500" />
              Photos & Analysis for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Before/after documentation with AI analysis</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={toggleCompareMode}
              variant={compareMode ? 'primary' : 'secondary'}
              className="flex items-center"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              {compareMode ? 'Exit Compare' : 'Compare Photos'}
            </Button>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
          </div>
        </div>

        {compareMode && (beforePhoto || afterPhoto) && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {beforePhoto && afterPhoto
                    ? 'Comparing photos - Click images below to view side-by-side'
                    : beforePhoto
                    ? 'Select second photo to compare'
                    : 'Select first photo'}
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setBeforePhoto(null);
                  setAfterPhoto(null);
                }}
                className="text-sm"
              >
                Reset Selection
              </Button>
            </div>
          </div>
        )}

        {beforePhoto && afterPhoto && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Comparison View</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Photo 1 - {beforePhoto.photo_type}
                </p>
                <img
                  src={beforePhoto.photo_url}
                  alt="Before"
                  className="w-full rounded-lg shadow-md"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {new Date(beforePhoto.photo_date).toLocaleDateString()}
                  {beforePhoto.view_angle && ` - ${beforePhoto.view_angle}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Photo 2 - {afterPhoto.photo_type}
                </p>
                <img
                  src={afterPhoto.photo_url}
                  alt="After"
                  className="w-full rounded-lg shadow-md"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {new Date(afterPhoto.photo_date).toLocaleDateString()}
                  {afterPhoto.view_angle && ` - ${afterPhoto.view_angle}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-2">
          {photoTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filterType === 'All' ? 'No Photos Yet' : `No ${filterType} Photos`}
            </h2>
            <p className="text-gray-600 mb-6">
              Upload before/after photos for treatment documentation
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload First Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => handlePhotoSelect(photo)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow ${
                  compareMode && (photo.id === beforePhoto?.id || photo.id === afterPhoto?.id)
                    ? 'ring-4 ring-blue-500'
                    : ''
                }`}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.photo_type}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="text-sm font-semibold">{photo.photo_type}</p>
                    <p className="text-xs">
                      {new Date(photo.photo_date).toLocaleDateString()}
                    </p>
                    {photo.view_angle && (
                      <p className="text-xs">{photo.view_angle}</p>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(photo);
                    }}
                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {photo.is_primary && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                    Primary
                  </div>
                )}
                {compareMode && photo.id === beforePhoto?.id && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded font-semibold">
                    Photo 1
                  </div>
                )}
                {compareMode && photo.id === afterPhoto?.id && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded font-semibold">
                    Photo 2
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Photo"
        maxWidth="2xl"
      >
        <AestheticPhotoUploadForm
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPhoto(null);
        }}
        title="Photo Details"
        maxWidth="4xl"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.photo_type}
              className="w-full rounded-lg shadow-lg"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-lg">{selectedPhoto.photo_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-lg">
                  {new Date(selectedPhoto.photo_date).toLocaleDateString()}
                </p>
              </div>
              {selectedPhoto.view_angle && (
                <div>
                  <p className="text-sm font-medium text-gray-500">View Angle</p>
                  <p className="text-lg">{selectedPhoto.view_angle}</p>
                </div>
              )}
              {selectedPhoto.treatment_area && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Treatment Area</p>
                  <p className="text-lg">{selectedPhoto.treatment_area}</p>
                </div>
              )}
            </div>
            {selectedPhoto.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{selectedPhoto.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    
  );
};

export default AestheticPhotos;
