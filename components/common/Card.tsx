import { cn } from '@/lib/utils';

type CardProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
};

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className,
  onClick,
  hover = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg shadow-md border border-gray-200 p-6',
        onClick && 'cursor-pointer',
        hover && 'hover:shadow-lg hover:border-blue-300 transition-all',
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
};
