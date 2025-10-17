import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';

const ChartSummarySkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300">
            <LoadingSkeleton variant="text" width="60%" className="mb-2" />
            <LoadingSkeleton variant="text" width="40%" height="32px" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <LoadingSkeleton variant="text" width="30%" height="24px" className="mb-4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="text-center p-3 bg-gray-50 rounded">
              <LoadingSkeleton variant="text" width="60%" className="mb-2 mx-auto" />
              <LoadingSkeleton variant="text" width="80%" height="24px" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <LoadingSkeleton variant="text" width="30%" height="24px" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded">
              <LoadingSkeleton variant="text" width="90%" className="mb-2" />
              <LoadingSkeleton variant="text" width="70%" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <LoadingSkeleton variant="text" width="30%" height="24px" className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-3 rounded bg-gray-100">
              <LoadingSkeleton variant="text" width="80%" className="mb-1" />
              <LoadingSkeleton variant="text" width="60%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartSummarySkeleton;
