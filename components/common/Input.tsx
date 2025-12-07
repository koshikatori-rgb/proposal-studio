import { cn } from '@/lib/utils';

type InputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  error,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          'px-3 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300'
        )}
      />
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};
