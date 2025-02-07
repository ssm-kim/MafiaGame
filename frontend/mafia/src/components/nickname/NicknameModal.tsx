import React, { useState } from 'react';

interface NicknameModalProps {
  show: boolean;
  // onClose: () => void;
  onSubmit: (nickname: string) => void;
}

function NicknameModal({ show, onSubmit }: NicknameModalProps): JSX.Element | null {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(nickname);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
        <h2
          className="text-2xl font-bold text-red-500 mb-6 text-center"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          생존자 닉네임 설정
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
            placeholder="사용할 닉네임을 입력하세요"
          />
          <button
            type="submit"
            className="w-full mt-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            확인
          </button>
        </form>
      </div>
    </div>
  );
}

export default NicknameModal;
