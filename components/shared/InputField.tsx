import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-lg text-sm
            bg-background-primary border border-border-primary
            text-content-primary placeholder:text-content-subtle
            focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary
            transition-colors
            ${error ? 'border-status-danger-border ring-1 ring-status-danger-border' : ''}
            ${className}
          `}
          {...rest}
        />
        {error && <p className="text-xs text-status-danger-foreground">{error}</p>}
        {hint && !error && <p className="text-xs text-content-subtle">{hint}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
