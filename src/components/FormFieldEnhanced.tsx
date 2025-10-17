import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldEnhancedProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  helpText?: string;
  id?: string;
}

const FormFieldEnhanced: React.FC<FormFieldEnhancedProps> = ({
  label,
  children,
  error,
  required,
  helpText,
  id
}) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Clone children and add accessibility props */}
      {React.isValidElement(children) &&
        React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': [
            error ? errorId : null,
            helpText ? helpId : null
          ].filter(Boolean).join(' ') || undefined,
          'aria-required': required ? 'true' : undefined
        })
      }

      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {error && (
        <div id={errorId} className="mt-1 flex items-start" role="alert" aria-live="polite">
          <AlertCircle className="w-4 h-4 text-red-600 mr-1 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FormFieldEnhanced;
