// import React from 'react';

interface TestSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateRoom: () => void;
}

function TestSearchBar({ searchTerm, onSearchChange, onCreateRoom }: TestSearchBarProps) {
  return (
    <div className="max-w-6xl mx-auto mb-6 flex items-center gap-4">
      <input
        type="text"
        placeholder="대피소 검색"
        className="flex-1 px-6 py-3 bg-gray-800 bg-opacity-90 rounded-lg text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button
        type="button"
        className="px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors duration-200 font-medium"
        onClick={onCreateRoom}
      >
        대피소 생성
      </button>
    </div>
  );
}

export default TestSearchBar;
