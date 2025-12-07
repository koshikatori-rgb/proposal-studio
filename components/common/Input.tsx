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
    <div className={cn('flex flex-col gap-3', className)}>
      {label && (
        <label className="text-xs font-medium text-gray-600 tracking-wider uppercase">
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
          'px-4 py-3 border transition-all text-sm tracking-wide',
          'focus:outline-none focus:border-black',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-gray-300'
        )}
      />
      {error && (
        <span className="text-xs text-red-600 tracking-wide">{error}</span>
      )}
    </div>
  );
};
