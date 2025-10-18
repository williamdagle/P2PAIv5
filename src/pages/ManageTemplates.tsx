import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import TemplateForm from '../components/TemplateForm';
import CategoryForm from '../components/CategoryForm';
import { Plus, Settings, FileText, User, Users } from 'lucide-react';

const ManageTemplates: React.FC = () => {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'clinic' | 'personal'>('personal');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userData = await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_current_user`,
          { method: 'GET' }
        );

        if (userData?.role_name === 'System Admin') {
          setIsSystemAdmin(true);
          setTemplateFilter('all');
        } else {
          setIsSystemAdmin(false);
          setTemplateFilter('personal');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setIsSystemAdmin(false);
        setTemplateFilter('personal');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = (template: any) => {
    setDeletingTemplate(template);
    setShowDeleteTemplateDialog(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!deletingTemplate) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_note_templates`,
        {
          method: 'DELETE',
          body: { id: deletingTemplate.id }
        }
      );

      showSuccess('Template deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteTemplateDialog(false);
      setDeletingTemplate(null);
    } catch (err) {
      showError('Failed to delete template', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTemplateSuccess = () => {
    showSuccess(
      editingTemplate ? 'Template updated successfully' : 'Template created successfully'
    );
    setShowTemplateForm(false);
    setEditingTemplate(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleTemplateCancel = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (category: any) => {
    setDeletingCategory(category);
    setShowDeleteCategoryDialog(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_note_categories`,
        {
          method: 'DELETE',
          body: { id: deletingCategory.id }
        }
      );

      showSuccess('Category deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteCategoryDialog(false);
      setDeletingCategory(null);
    } catch (err) {
      showError('Failed to delete category', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCategorySuccess = () => {
    showSuccess(
      editingCategory ? 'Category updated successfully' : 'Category created successfully'
    );
    setShowCategoryForm(false);
    setEditingCategory(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCategoryCancel = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const buildTemplateQuery = () => {
    let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_note_templates`;
    if (templateFilter !== 'all') {
      url += `?filter=${templateFilter}`;
    }
    return url;
  };

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Templates & Categories</h1>
          <p className="text-gray-600">Configure note templates and categories for your clinic</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${isSystemAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
            {/* Templates Section */}
            <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Note Templates</h2>
                </div>
                <Button
                  onClick={handleAddTemplate}
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                {isSystemAdmin && (
                  <>
                    <button
                      onClick={() => setTemplateFilter('all')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        templateFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-1" />
                      All Templates
                    </button>
                    <button
                      onClick={() => setTemplateFilter('clinic')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        templateFilter === 'clinic'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-1" />
                      Clinic Templates
                    </button>
                  </>
                )}
                <button
                  onClick={() => setTemplateFilter('personal')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    templateFilter === 'personal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-1" />
                  My Templates
                </button>
              </div>
            </div>

            <div className="p-6">
              <DataTable
                key={`templates-${refreshKey}-${templateFilter}`}
                apiUrl={buildTemplateQuery()}
                columns={['name', 'template_type', 'description']}
                showActions={true}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
              />
            </div>
          </div>

            {/* Categories Section - Only for System Admins */}
            {isSystemAdmin && (
              <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Note Categories</h2>
                </div>
                <Button
                  onClick={handleAddCategory}
                  variant="secondary"
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <div className="p-6">
              <DataTable
                key={`categories-${refreshKey}`}
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_note_categories`}
                columns={['name', 'description', 'color']}
                showActions={true}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
              />
              </div>
            </div>
            )}
          </div>
        )}

        {/* Template Form Modal */}
        <Modal
          isOpen={showTemplateForm}
          onClose={handleTemplateCancel}
          title={editingTemplate ? 'Edit Note Template' : 'Create Note Template'}
          size="xl"
        >
          <TemplateForm
            template={editingTemplate}
            onSuccess={handleTemplateSuccess}
            onCancel={handleTemplateCancel}
          />
        </Modal>

        {/* Category Form Modal */}
        <Modal
          isOpen={showCategoryForm}
          onClose={handleCategoryCancel}
          title={editingCategory ? 'Edit Note Category' : 'Create Note Category'}
          size="lg"
        >
          <CategoryForm
            category={editingCategory}
            onSuccess={handleCategorySuccess}
            onCancel={handleCategoryCancel}
          />
        </Modal>

        {/* Delete Template Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteTemplateDialog}
          onClose={() => setShowDeleteTemplateDialog(false)}
          onConfirm={confirmDeleteTemplate}
          title="Delete Template"
          message={`Are you sure you want to delete "${deletingTemplate?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />

        {/* Delete Category Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteCategoryDialog}
          onClose={() => setShowDeleteCategoryDialog(false)}
          onConfirm={confirmDeleteCategory}
          title="Delete Category"
          message={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    
  );
};

export default ManageTemplates;
