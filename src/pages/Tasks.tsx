import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import { Task } from '../types';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TaskForm from '../components/TaskForm';
import Button from '../components/Button';
import { Plus, CheckCircle, Clock, AlertCircle, XCircle, Filter } from 'lucide-react';

interface TasksProps {
  onNavigate: (page: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<'all' | 'my_tasks' | 'overdue' | 'due_today'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
          { method: 'GET' }
        );
        if (response.users) {
          const currentUser = response.users.find((user: any) => user.auth_user_id === globals.user_id);
          if (currentUser) {
            setCurrentUserId(currentUser.id);
          }
        }
      } catch (err) {
        console.error('Failed to load current user:', err);
      }
    };
    getCurrentUser();
  }, [globals.user_id]);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_tasks`;
        const params = new URLSearchParams();

        if (globals.selected_patient_id) {
          params.append('patient_id', globals.selected_patient_id);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await apiCall<Task[]>(url, { method: 'GET' });
        setTasks(response || []);
      } catch (err) {
        showError('Failed to load tasks', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [refreshKey, globals.selected_patient_id]);

  useEffect(() => {
    let filtered = [...tasks];

    if (filter === 'my_tasks' && currentUserId) {
      filtered = filtered.filter(task => task.assigned_to === currentUserId);
    } else if (filter === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(task =>
        task.due_date && new Date(task.due_date) < now && task.status !== 'completed' && task.status !== 'cancelled'
      );
    } else if (filter === 'due_today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= today && dueDate < tomorrow && task.status !== 'completed' && task.status !== 'cancelled';
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, filter, statusFilter, priorityFilter, currentUserId]);

  const handleAddNew = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (task: Task) => {
    setDeletingTask(task);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_tasks?id=${deletingTask.id}`,
        { method: 'DELETE' }
      );

      showSuccess('Task deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingTask(null);
    } catch (err) {
      showError('Failed to delete task', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(editingTask ? 'Task updated successfully' : 'Task created successfully');
    setShowForm(false);
    setEditingTask(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-gray-600" />;
      case 'deferred': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <Layout>
      <Sidebar currentPage="Tasks" onPageChange={onNavigate} />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {globals.selected_patient_id ? `Tasks for ${globals.selected_patient_name}` : 'All Tasks'}
            </h1>
            <p className="text-gray-600">Manage tasks and workflows</p>
          </div>
          <Button onClick={handleAddNew} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('my_tasks')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'my_tasks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setFilter('due_today')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'due_today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Due Today
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Overdue
            </button>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="deferred">Deferred</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {filter !== 'all' ? 'Try adjusting your filters' : 'Create your first task to get started'}
            </p>
            {filter === 'all' && (
              <Button onClick={handleAddNew}>Create Task</Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className={isOverdue(task) ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {task.description}
                            </div>
                          )}
                          {task.patient_name && (
                            <div className="text-xs text-gray-400 mt-1">
                              Patient: {task.patient_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(task.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assignee_name || task.assigned_to_role || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.due_date ? (
                          <div className={`text-sm ${isOverdue(task) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                            {new Date(task.due_date).toLocaleString()}
                            {isOverdue(task) && (
                              <div className="text-xs text-red-600">Overdue</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No due date</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          size="lg"
        >
          <TaskForm
            task={editingTask || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default Tasks;
