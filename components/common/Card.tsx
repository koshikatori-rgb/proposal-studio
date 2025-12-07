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
        'bg-white border border-gray-200 p-8',
        onClick && 'cursor-pointer',
        hover && 'hover:border-black transition-all duration-200',
        className
      )}
    >
      {title && (
        <h3 className="text-base font-medium text-black mb-6 tracking-wide">{title}</h3>
      )}
      {children}
    </div>
  );
};
