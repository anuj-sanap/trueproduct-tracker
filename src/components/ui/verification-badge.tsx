import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  status: 'original' | 'fake' | 'expired' | 'unknown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerificationBadge({ status, size = 'md', showLabel = true }: VerificationBadgeProps) {
  const sizeStyles = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const statusConfig = {
    original: {
      icon: CheckCircle,
      label: 'ORIGINAL',
      className: 'gradient-success text-success-foreground verified-glow',
    },
    fake: {
      icon: XCircle,
      label: 'FAKE',
      className: 'gradient-danger text-danger-foreground fake-glow',
    },
    expired: {
      icon: AlertTriangle,
      label: 'EXPIRED',
      className: 'bg-warning text-warning-foreground',
    },
    unknown: {
      icon: AlertTriangle,
      label: 'UNKNOWN',
      className: 'bg-muted text-muted-foreground',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="flex flex-col items-center gap-3"
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          sizeStyles[size],
          config.className
        )}
      >
        <Icon className={iconSizes[size]} />
      </div>
      {showLabel && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'font-display font-bold tracking-wider',
            textSizes[size],
            status === 'original' ? 'text-success' : 
            status === 'fake' ? 'text-danger' :
            status === 'expired' ? 'text-warning' : 'text-muted-foreground'
          )}
        >
          {config.label}
        </motion.p>
      )}
    </motion.div>
  );
}
