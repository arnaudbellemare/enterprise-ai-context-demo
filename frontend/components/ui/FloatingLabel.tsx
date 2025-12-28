import React, { useState, useRef } from 'react';

interface FloatingLabelProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  ariaLabel?: string;
  id?: string;
  type?: 'text' | 'email';
}

export const FloatingLabel: React.FC<FloatingLabelProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  multiline = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  ariaLabel,
  id,
  type = 'text',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const hasValue = value.length > 0;
  const labelFloating = isFocused || hasValue;

  const charCount = value.length;
  const isOverLimit = maxLength ? charCount > maxLength : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const commonProps = {
    value,
    onChange: handleChange,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    disabled,
    placeholder: labelFloating ? placeholder : '',
    className: `
      w-full
      px-4
      ${multiline ? 'py-4' : 'py-3'}
      bg-transparent
      text-white
      placeholder-gray-500
      outline-none
      transition-all
      duration-300
      ${disabled ? 'cursor-not-allowed opacity-50' : ''}
    `,
    'aria-label': ariaLabel || label,
    id: id || label.toLowerCase().replace(/\s+/g, '-'),
  };

  return (
    <div className="relative">
      {/* Floating label container */}
      <div
        className={`
          relative
          rounded-xl
          border
          transition-all
          duration-300
          ${
            isFocused
              ? 'border-[#007AFF] ring-2 ring-[#007AFF]/20'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {/* Inner container */}
        <div
          className="bg-gray-50 rounded-xl"
        >
          {/* Label */}
          <label
            htmlFor={commonProps.id}
            className={`
              absolute
              left-4
              transition-all
              duration-300
              pointer-events-none
              font-medium
              ${
                labelFloating
                  ? 'top-2 text-xs text-[#007AFF]'
                  : 'top-1/2 -translate-y-1/2 text-base text-gray-400'
              }
              ${isFocused ? 'text-[#007AFF]' : ''}
            `}
          >
            {label}
          </label>

          {/* Input field */}
          {multiline ? (
            <textarea
              {...commonProps}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              rows={rows}
              maxLength={maxLength}
              style={{ paddingTop: labelFloating ? '1.75rem' : '0.75rem' }}
            />
          ) : (
            <input
              {...commonProps}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              maxLength={maxLength}
              style={{ paddingTop: labelFloating ? '1.75rem' : '0.75rem' }}
            />
          )}
        </div>
      </div>

      {/* Character count */}
      {showCharCount && maxLength && (
        <div
          className={`
            mt-2
            text-sm
            text-right
            transition-colors
            duration-300
            ${isOverLimit ? 'text-red-400 font-semibold' : 'text-gray-500'}
          `}
        >
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </div>
      )}

      {/* Progress bar */}
      {showCharCount && maxLength && (
        <div className="mt-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`
              h-full
              transition-all
              duration-300
              ${isOverLimit ? 'bg-red-500' : 'bg-[#007AFF]'}
            `}
            style={{ width: `${Math.min((charCount / maxLength) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
