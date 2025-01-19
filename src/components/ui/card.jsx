// import React from 'react'


// export function Card({ children, className, ...props }) {
//   return (
//     <div 
//       className={`border rounded-lg shadow-sm ${className}`} 
//       {...props}
//     >
//       {children}
//     </div>
//   )
// }

import React from 'react';

// Card component
export function Card({ children, className, ...props }) {
  return (
    <div 
      className={`border rounded-lg shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

// CardHeader component
export function CardHeader({ children }) {
  return (
    <div className="bg-gray-100 p-4 border-b">
      {children}
    </div>
  );
}

// CardContent component
export function CardContent({ children }) {
  return (
    <div className="p-4">
      {children}
    </div>
  );
}
