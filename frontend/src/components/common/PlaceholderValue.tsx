import { cn } from '@/lib/utils';

interface PlaceholderValueProps {
  className?: string;
  label?: string;
}

export function PlaceholderValue({
  className,
  label = 'TO BE FILLED AFTER FINAL MODEL VALIDATION',
}: PlaceholderValueProps) {
  return (
    <span className={cn('italic text-xs text-slate-400', className)}>
      {label}
    </span>
  );
}

export default PlaceholderValue;