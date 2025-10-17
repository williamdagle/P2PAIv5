import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = ''
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
    card: 'rounded-lg h-48',
    table: 'h-16 rounded'
  };

  const style = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || undefined
  };

  const skeletonElements = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
    </div>
  ));

  return count > 1 ? (
    <div className="space-y-3">{skeletonElements}</div>
  ) : (
    <>{skeletonElements}</>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-6 py-3">
                <LoadingSkeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <LoadingSkeleton variant="text" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md">
          <LoadingSkeleton variant="rectangular" height="120px" className="mb-4" />
          <LoadingSkeleton variant="text" width="80%" className="mb-2" />
          <LoadingSkeleton variant="text" width="60%" />
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <LoadingSkeleton variant="text" width="30%" height="16px" />
          <LoadingSkeleton variant="rectangular" height="40px" />
        </div>
      ))}
      <div className="flex space-x-4 mt-6">
        <LoadingSkeleton variant="rectangular" width="120px" height="40px" />
        <LoadingSkeleton variant="rectangular" width="120px" height="40px" />
      </div>
    </div>
  );
};

export default LoadingSkeleton;
