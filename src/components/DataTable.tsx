import React, { useEffect, useState } from 'react';
import { useApiWithCircuitBreaker } from '../hooks/useApiWithCircuitBreaker';
import { Loader2, CreditCard as Edit, Trash2, Search, X } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { validateDataClinicIds, filterDataByClinic } from '../utils/patientLookup';
import Button from './Button';
import ApiErrorBoundary from './ApiErrorBoundary';

interface DataTableProps<T = Record<string, unknown>> {
  apiUrl: string;
  columns: string[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  showActions?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  customRenderers?: Record<string, (value: unknown, row: T) => React.ReactNode>;
  actionButtons?: (row: T) => React.ReactNode;
}

function DataTable<T = Record<string, unknown>>({
  apiUrl,
  columns,
  onRowClick,
  onEdit,
  onDelete,
  showActions = false,
  searchable = false,
  searchPlaceholder = "Search...",
  className = '',
  customRenderers,
  actionButtons
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const { apiCall, loading, error, resetCircuitBreaker } = useApiWithCircuitBreaker();
  const { globals } = useGlobal();

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(row => {
      return columns.some(column => {
        const value = row[column];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });

    setFilteredData(filtered);
  }, [data, searchTerm, columns]);
  useEffect(() => {
    // Prevent infinite loops by checking if we already have data for this URL
    if (!apiUrl || !globals.access_token) {
      console.log('⚠️ DataTable: No API URL or access token available', {
        hasApiUrl: !!apiUrl,
        hasAccessToken: !!globals.access_token,
        clinicId: globals.clinic_id
      });
      return;
    }

    // Only fetch if we haven't initialized or URL changed
    if (isInitialized) {
      console.log('🔄 DataTable already initialized, skipping fetch for:', apiUrl);
      return;
    }

    const fetchData = async () => {
      console.log('🚀 DataTable fetching data from:', apiUrl, {
        clinicId: globals.clinic_id,
        userId: globals.user_id,
        selectedPatient: globals.selected_patient_id
      });
      setApiError('');
      setIsInitialized(true);

      try {
        const response = await apiCall<Record<string, unknown> | T[]>(apiUrl, { method: 'GET' });
        
        console.log('📨 DataTable received response:', {
          type: typeof response,
          keys: Object.keys(response || {}),
          hasData: !!response
        });
        
        // Handle successful response
        let dataArray: T[] = [];
        
        if (response && typeof response === 'object') {
          // Check for specific data properties
          const dataKeys = ['patients', 'appointments', 'treatment_plans', 'timeline_events',
                           'labs', 'medications', 'supplements', 'users', 'clinics', 'organizations',
                           'reports', 'checks', 'assessments', 'scans', 'controls'];
          
          for (const key of dataKeys) {
            if (response[key] && Array.isArray(response[key])) {
              dataArray = response[key] as T[];
              console.log(`✅ Found data in ${key}:`, {
                count: dataArray.length,
                firstItem: dataArray[0] ? {
                  id: dataArray[0].id,
                  clinic_id: dataArray[0].clinic_id,
                  patient_id: dataArray[0].patient_id
                } : null
              });
              break;
            }
          }
          
          // If no specific key found, check if response itself is an array
          if (dataArray.length === 0 && Array.isArray(response)) {
            dataArray = response as T[];
            console.log('✅ Using response as array:', {
              count: dataArray.length,
              firstItem: dataArray[0] ? {
                id: dataArray[0].id,
                clinic_id: dataArray[0].clinic_id
              } : null
            });
          }
        }
        
        // Enhanced debugging for data filtering
        console.log('🔍 Debug DataTable - Raw data analysis:', {
          totalItems: dataArray.length,
          itemsWithClinicId: dataArray.filter(item => item.clinic_id).length,
          uniqueClinicIds: [...new Set(dataArray.map(item => item.clinic_id))],
          currentUserClinic: globals.clinic_id,
          apiUrl: apiUrl
        });
        
        // Validate clinic_id presence for debugging
        if (dataArray.length > 0) {
          validateDataClinicIds(dataArray, 'DataTable');
          
          // Additional filtering validation
          const clinicFilteredData = filterDataByClinic(dataArray, globals.clinic_id, 'DataTable');
          
          if (clinicFilteredData.length !== dataArray.length) {
            console.warn('⚠️ DataTable - RLS filtering may not be working correctly:', {
              originalCount: dataArray.length,
              filteredCount: clinicFilteredData.length,
              shouldBeEqual: true
            });
          }
        }
        
        console.log('📊 Final data array:', {
          count: dataArray.length,
          allHaveClinicId: dataArray.every(item => item.clinic_id),
          clinicIds: [...new Set(dataArray.map(item => item.clinic_id))],
          currentUserClinic: globals.clinic_id
        });
        
        setData(dataArray);
      } catch (err) {
        console.error('❌ DataTable fetch error:', err);
        console.log('🔍 DataTable error details:', {
          name: err.constructor.name,
          message: err.message,
          apiUrl: apiUrl,
          hasAuth: !!globals.access_token
        });
        setApiError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
        setFilteredData([]);
      }
    };

    console.log('🎯 DataTable useEffect triggered:', {
      url: apiUrl,
      clinicId: globals.clinic_id,
      hasAuth: !!globals.access_token
    });
    fetchData();
  }, [apiUrl, globals.access_token]); // Removed apiCall from dependencies to prevent infinite loop

  // Reset initialization when URL changes
  useEffect(() => {
    setIsInitialized(false);
    setApiError('');
    setSearchTerm('');
    setData([]);
    setFilteredData([]);
  }, [apiUrl]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const retryData = () => {
    if (apiUrl) {
      const endpoint = apiUrl.split('/functions/v1/')[1]?.split('?')[0];
      if (endpoint) {
        resetCircuitBreaker(endpoint);
      }
    }
    setIsInitialized(false);
    setApiError('');
    setData([]);
    setFilteredData([]);
  };

  const displayData = searchable ? filteredData : data;

  return (
    <ApiErrorBoundary
      error={error || apiError}
      loading={loading}
      onRetry={retryData}
      functionName={apiUrl ? apiUrl.split('/functions/v1/')[1]?.split('?')[0] : 'unknown'}
      showFunctionHelp={true}
    >
      <div className={className}>
        {searchable && (
          <div className="mb-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchable && searchTerm && (
              <p className="text-sm text-gray-500 mt-2">
                Showing {displayData.length} of {data.length} results
              </p>
            )}
          </div>
        )}
        
        {!data.length && !loading && !error && !apiError ? (
          <div className="p-8 text-center text-gray-500">
            No data available
          </div>
        ) : displayData.length === 0 && searchTerm ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
            <p>Try adjusting your search terms or clear the search to see all records.</p>
            <button
              onClick={clearSearch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                    >
                      {column.replace('_', ' ').toUpperCase()}
                    </th>
                  ))}
                  {(showActions || actionButtons) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      ACTIONS
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayData.map((row, index) => (
                  <tr
                    key={index}
                    className={`
                      transition-colors
                      ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                    `}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {customRenderers && customRenderers[column]
                          ? customRenderers[column](row[column], row)
                          : (row[column] || '-')}
                      </td>
                    ))}
                    {(showActions || actionButtons) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {actionButtons ? (
                          <div onClick={(e) => {
                            e.stopPropagation();
                            console.log('DataTable actionButtons rendering with row:', row);
                            console.log('Row keys:', row ? Object.keys(row) : 'row is null/undefined');
                          }}>
                            {actionButtons(row)}
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            {onEdit && (
                              <Button
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(row);
                                }}
                                className="p-2"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row);
                                }}
                                className="p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ApiErrorBoundary>
  );
}

export default DataTable as <T = Record<string, unknown>>(props: DataTableProps<T>) => JSX.Element;
