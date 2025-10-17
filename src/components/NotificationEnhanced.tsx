import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationEnhancedProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const NotificationEnhanced: React.FC<NotificationEnhancedProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, onClose, isPaused]);

  // Focus notification when it appears for screen readers
  useEffect(() => {
    notificationRef.current?.focus();
  }, []);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  const Icon = icons[type];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Map notification types to ARIA roles
  const ariaRole = type === 'error' || type === 'warning' ? 'alert' : 'status';

  return (
    <div
      ref={notificationRef}
      role={ariaRole}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      tabIndex={-1}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`border rounded-lg p-4 shadow-lg ${colors[type]}`}>
        <div className="flex items-start">
          <Icon
            className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${iconColors[type]}`}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{title}</p>
            {message && (
              <p className="text-sm mt-1 opacity-90">{message}</p>
            )}
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  handleClose();
                }}
                className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationEnhanced;
