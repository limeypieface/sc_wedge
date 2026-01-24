import React from 'react';

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({ 
  size = 16, 
  color = '#EBBC00',
  className = ''
}) => {
  return (
    <div 
      className={`inline-block ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg 
        width={size}
        height={size}
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="15.7 47.1"
          fill="none"
        />
      </svg>
    </div>
  );
};

