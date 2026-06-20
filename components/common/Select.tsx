
import React from 'react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string; // Explicitly define placeholder prop
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  error, 
  options, 
  containerClassName = '', 
  className = '', 
  placeholder, // Destructure placeholder
  ...otherProps // Use 'otherProps' for the rest
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-[48px] px-4 py-2.5 border border-slate-300 bg-white rounded-lg shadow-sm text-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary touch-manipulation ${error ? 'border-red-500' : ''} ${className}`}
        {...otherProps} // Spread otherProps
      >
        {placeholder && <option value="">{placeholder}</option>} 
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
