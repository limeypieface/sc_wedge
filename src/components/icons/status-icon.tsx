import React from 'react';

const STATUS_COLORS = {
  INCOMPLETE: '#EBBC00',
  COMPLETE: '#18794E'
} as const;

interface StatusIconProps extends React.SVGProps<SVGSVGElement> {
  percent: number;
}

const StatusIconComponent = ({ percent = 0, ...props }: StatusIconProps) => {
  // Normalize percent to 0-1 range if it's in 0-100 range
  const normalizedPercent = percent > 1 ? percent / 100 : percent;
  
  // Clamp between 0 and 1
  const clampedPercent = Math.max(0, Math.min(1, normalizedPercent));
  
  // Determine color based on completion
  const fillColor = clampedPercent >= 1 ? STATUS_COLORS.COMPLETE : STATUS_COLORS.INCOMPLETE;
  
  // Calculate the angle for the pie slice (0 to 360 degrees)
  const angle = clampedPercent * 360;
  
  // Convert angle to radians
  const angleRad = (angle - 90) * Math.PI / 180; // -90 to start from top
  
  // Calculate end point of the arc
  const x = 12 + 7 * Math.cos(angleRad);
  const y = 12 + 7 * Math.sin(angleRad);
  
  // Determine if we need a large arc (> 180 degrees)
  const largeArcFlag = angle > 180 ? 1 : 0;
  
  // Create the path for the pie slice
  let piePath = '';
  if (clampedPercent > 0 && clampedPercent < 1) {
    piePath = `M12 12 L12 5 A7 7 0 ${largeArcFlag} 1 ${x} ${y} Z`;
  }
  
  return (
    <svg
      width="24"
      height="24"
      fill={clampedPercent >= 1 ? "none" : "currentColor"}
      {...props}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1ZM12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" 
        fill={fillColor}
        stroke={"none"}
      />
      
      {/* Pie slice for partial completion */}
      {clampedPercent > 0 && clampedPercent < 1 && (
        <path d={piePath} fill={fillColor} />
      )}
      
      {/* Full circle for 100% completion */}
      {clampedPercent >= 1 && (
        <circle cx="12" cy="12" r="7" fill={fillColor} />
      )}
    </svg>
  );
};

// Export wrapper function that returns React.createElement
export const StatusIcon = (props: StatusIconProps) => 
  React.createElement(StatusIconComponent, props);