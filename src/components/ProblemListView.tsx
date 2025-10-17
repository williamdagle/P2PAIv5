import React, { useState } from 'react';
import { AlertCircle, Plus, CreditCard as Edit2, X } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import ProblemListForm from './ProblemListForm';

interface Problem {
  id: string;
  problem: string;
  icd10_code?: string;
  snomed_code?: string;
  onset_date?: string;
  resolution_date?: string;
  status: 'active' | 'chronic' | 'resolved' | 'inactive';
  severity?: 'mild' | 'moderate' | 'severe';
  priority?: number;
  notes?: string;
  created_at: string;
}

interface ProblemListViewProps {
  problems: Problem[];
  onRefresh: () => void;
}

const ProblemListView: React.FC<ProblemListViewProps> = ({ problems, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProblems = problems.filter(problem => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active-chronic') return problem.status === 'active' || problem.status === 'chronic';
    return problem.status === filterStatus;
  });

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    if (a.priority && b.priority) {
      return a.priority - b.priority;
    }
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    if (a.status === 'chronic' && b.status !== 'chronic') return -1;
    if (a.status !== 'chronic' && b.status === 'chronic') return 1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'chronic':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 text-red-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'mild':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority?: number) => {
    if (!priority) return 'N/A';
    switch (priority) {
      case 1:
        return 'Critical';
      case 2:
        return 'High';
      case 3:
        return 'Medium';
      case 4:
        return 'Low';
      case 5:
        return 'Very Low';
      default:
        return String(priority);
    }
  };

  const handleFormSuccess = () => {
    setShowAddModal(false);
    setEditingProblem(null);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            Problem List
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({problems.length})
            </button>
            <button
              onClick={() => setFilterStatus('active-chronic')}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === 'active-chronic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active/Chronic ({problems.filter(p => p.status === 'active' || p.status === 'chronic').length})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved ({problems.filter(p => p.status === 'resolved').length})
            </button>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Problem
        </Button>
      </div>

      {sortedProblems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No problems found</p>
          <p className="text-sm text-gray-500 mt-1">Add problems to track patient conditions</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ICD-10
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onset Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProblems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        problem.priority === 1 ? 'bg-red-100 text-red-800' :
                        problem.priority === 2 ? 'bg-orange-100 text-orange-800' :
                        problem.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getPriorityLabel(problem.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{problem.problem}</div>
                      {problem.notes && (
                        <div className="text-sm text-gray-500 mt-1">{problem.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {problem.icd10_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                        {problem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {problem.severity ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(problem.severity)}`}>
                          {problem.severity}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {problem.onset_date ? new Date(problem.onset_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingProblem(problem)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Problem"
        >
          <ProblemListForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {editingProblem && (
        <Modal
          isOpen={!!editingProblem}
          onClose={() => setEditingProblem(null)}
          title="Edit Problem"
        >
          <ProblemListForm
            problem={editingProblem}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingProblem(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProblemListView;
