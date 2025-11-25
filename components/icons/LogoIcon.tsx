import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M21 15.46l-9 5.2-9-5.2L3 18l9 5.2 9-5.2-1.01-2.54zM12 3L3 8.2l9 5.2 9-5.2L12 3zm0 11.26L5.84 10.5 12 7.24 18.16 10.5 12 14.26z" />
  </svg>
);