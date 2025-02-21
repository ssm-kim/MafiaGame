interface PasswordModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export function PasswordModal({ show, onClose, onSubmit }: PasswordModalProps) {
  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get('password') as string;
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border-2 border-red-700">
        <h2
          className="text-2xl font-bold text-red-500 mb-6 text-center"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          ! 보안 구역 !
        </h2>

        <div className="mb-6 text-center">
          <p
            className="text-red-400 text-sm"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            이 대피소는 보안 코드가 필요합니다
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-3 bg-gray-800 border-2 border-red-900 rounded-lg focus:outline-none focus:border-red-500 text-gray-100 text-center"
              placeholder="보안 코드를 입력하세요"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200 border border-gray-700"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors duration-200 border border-red-700"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              입장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordModal;
