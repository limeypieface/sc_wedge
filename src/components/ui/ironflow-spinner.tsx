import React from 'react';

interface IronflowSpinnerProps {
  size?: number;
  className?: string;
}

export const IronflowSpinner: React.FC<IronflowSpinnerProps> = ({ 
  size = 20,
  className = ''
}) => {
  const height = size * 1.15; // Maintain aspect ratio
  
  return (
    <div 
      className={className}
      style={{
        width: `${size}px`,
        height: `${height}px`,
        animation: 'float 1.75s ease-in-out infinite',
        perspective: '1000px',
      }}
    >
      <svg 
        style={{
          width: `${size}px`,
          height: `${height}px`,
          transformStyle: 'preserve-3d',
          transformOrigin: `${size/2}px ${height/2}px`,
          animation: 'whipSpin 2s linear infinite',
          filter: 'drop-shadow(0 0 3px #EBBC0055)',
        }}
        viewBox="0 0 97 110" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`hypnoGradient-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A09FA6" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#EBBC00" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        <path 
          fill={`url(#hypnoGradient-${size})`} 
          d="M70.0091 11.5616L51.2842 0.735562C49.5877 -0.245248 47.4977 -0.245183 45.8013 0.735731L2.99157 25.49C1.29508 26.471 0.25 28.2839 0.25 30.2459V79.7542C0.25 81.7162 1.29508 83.5291 2.99157 84.5101L45.8011 109.264C47.4976 110.245 49.5878 110.245 51.2843 109.264L94.0938 84.5101C95.7903 83.5291 96.8354 81.7162 96.8354 79.7542V30.2457C96.8354 28.2838 95.7904 26.471 94.094 25.49L70.0091 11.5616ZM53.9162 45.6918L44.5539 51.1047C43.7055 51.5952 43.1829 52.5017 43.1829 53.4827V94.1467C43.1829 94.6751 42.6117 95.0054 42.1548 94.7411L12.3674 77.512C11.5194 77.0215 10.997 76.1151 10.997 75.1342V34.8661C10.997 33.8851 11.5195 32.9787 12.3677 32.4882L47.1854 12.3544C48.0338 11.8638 49.079 11.8638 49.9273 12.3545L79.7146 29.5836C80.1714 29.8478 80.1714 30.5083 79.7145 30.7725L53.9162 45.6918ZM32.4497 51.8973V47.277C32.4497 46.2961 32.9722 45.3897 33.8204 44.8991L58.2479 30.7726C58.7048 30.5084 58.7047 29.8478 58.2478 29.5836L48.8854 24.1707C48.6733 24.0481 48.4121 24.0481 48.2 24.1707L23.0871 38.6936C22.239 39.1842 21.7165 40.0906 21.7165 41.0715V70.1175C21.7165 70.3627 21.8471 70.5893 22.0592 70.712L31.4216 76.1249C31.8786 76.3891 32.4497 76.0588 32.4497 75.5304V51.8973ZM53.9162 64.3083V59.6879C53.9162 58.707 54.4386 57.8006 55.2867 57.3101L85.074 40.081C85.5309 39.8167 86.1021 40.147 86.1021 40.6754V75.1342C86.1021 76.1151 85.5797 77.0215 84.7317 77.512L54.9443 94.7411C54.4874 95.0054 53.9162 94.6751 53.9162 94.1467V83.3212C53.9162 83.0759 54.0468 82.8493 54.2589 82.7267L75.0399 70.712C75.252 70.5893 75.3826 70.3627 75.3826 70.1175V59.2917C75.3826 58.7633 74.8115 58.433 74.3546 58.6972L54.9442 69.9194C54.4873 70.1836 53.9162 69.8533 53.9162 69.3249V64.3083Z"
        />
      </svg>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes whipSpin {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
};


