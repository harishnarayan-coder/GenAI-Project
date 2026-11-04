import React from 'react';
import { clsx } from 'clsx';

type PriorityLevel = 'High' | 'Medium' | 'Low';
type StatusLevel = 'Pending' | 'In Progress' | 'Completed' | 'processing' | 'completed' | 'failed';
type BadgeVariant = 'default' | 'priority' | 'status' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  priority?: PriorityLevel;
  status?: StatusLevel;
  className?: string;
}

const priorityClasses: Record<PriorityLevel, string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800',
};

const statusClasses: Record<StatusLevel, string> = {
  'Pending': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800',
  'processing': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800',
  'failed': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800',
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  priority: '',
  status: '',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function Badge({ children, variant = 'default', priority, status, className }: BadgeProps) {
  let classes = variantClasses[variant];
  if (priority) classes = priorityClasses[priority];
  if (status) classes = statusClasses[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        classes,
        className
      )}
    >
      {children}
    </span>
  );
}
