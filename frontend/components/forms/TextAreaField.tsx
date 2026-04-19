'use client';

import { forwardRef } from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, Props>(function TextAreaField(
  { label, error, className = '', id, ...rest },
  ref,
) {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        className={`form-input ${error ? 'border-red-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});
