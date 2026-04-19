'use client';

import { forwardRef } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  /** Visually hide label but keep it for accessibility / id generation */
  hideLabel?: boolean;
};

export const InputField = forwardRef<HTMLInputElement, Props>(function InputField(
  { label, error, hint, hideLabel, className = '', id, ...rest },
  ref,
) {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={
          hideLabel
            ? 'sr-only'
            : 'mb-1 block text-sm font-medium text-gray-700'
        }
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`form-input ${error ? 'border-red-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});
