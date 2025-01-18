import React from 'react'


export function Card({ children, className, ...props }) {
  return (
    <div 
      className={`border rounded-lg shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
}