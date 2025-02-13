// import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="text-center mb-4 sm:mb-8">
      <h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-500 mb-2"
        style={{ fontFamily: 'BMEuljiro10yearslater' }}
      >
        {title}
      </h1>
      <p
        className="text-sm sm:text-base text-gray-400"
        style={{ fontFamily: 'BMEuljiro10yearslater' }}
      >
        {subtitle}
      </p>
    </div>
  );
}

export default Header;
