// import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1
        className="text-4xl font-bold text-red-500 mb-2"
        style={{ fontFamily: 'BMEuljiro10yearslater' }}
      >
        {title}
      </h1>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  );
}

export default Header;
