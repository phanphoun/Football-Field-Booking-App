import React from 'react';

const Card = ({ className = '', children }) => (
  <div className={`bg-white shadow-sm ring-1 ring-gray-200 rounded-xl ${className}`}>{children}</div>
);

export const CardHeader = ({ className = '', children }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
);

export const CardBody = ({ className = '', children }) => <div className={`p-6 ${className}`}>{children}</div>;

export default Card;

