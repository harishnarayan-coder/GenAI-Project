import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  onClick?: () => void;
}

export default function StatCard({ label, value, icon, iconBg = 'bg-indigo-100 dark:bg-indigo-900/40', trend, className, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-all duration-200',
        onClick && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.value > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : trend.value < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
              <span className={clsx(
                'text-xs font-medium',
                trend.value > 0 ? 'text-green-600 dark:text-green-400' :
                trend.value < 0 ? 'text-red-600 dark:text-red-400' :
                'text-gray-500'
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
