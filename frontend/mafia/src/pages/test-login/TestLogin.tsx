// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '@/api/axios';

// interface LoginForm {
//   username: string;
//   password: string;
// }

// function TestLoginPage(): JSX.Element {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState<LoginForm>({
//     username: '',
//     password: '',
//   });
//   const [error, setError] = useState<string>('');

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const generateConsistentMemberId = (username: string) => {
//     // 간단한 해시 함수를 사용하여 username을 숫자로 변환
//     let hash = 0;
//     for (let i = 0; i < username.length; i++) {
//       hash = (hash << 5) - hash + username.charCodeAt(i);
//       hash &= hash; // Convert to 32-bit integer
//     }
//     // 1부터 1000 사이의 숫자로 변환
//     return Math.abs(hash % 1000) + 1;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const memberId = generateConsistentMemberId(formData.username);
//       localStorage.setItem('memberId', String(memberId));
//       localStorage.setItem('nickname', `테스트유저${memberId}`);
//       console.log(memberId);
//       navigate('/test-lobby');
//     } catch (err) {
//       setError('로그인 실패');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
//       <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
//         <div className="text-center">
//           <h2 className="text-3xl font-bold text-red-600">테스트 로그인</h2>
//           <p className="mt-2 text-gray-400">아무 정보나 입력하세요</p>
//         </div>

//         <form
//           className="mt-8 space-y-6"
//           onSubmit={handleSubmit}
//         >
//           <div className="space-y-4">
//             <div>
//               <label
//                 htmlFor="username"
//                 className="sr-only"
//               >
//                 사용자 이름
//               </label>
//               <input
//                 id="username"
//                 name="username"
//                 type="text"
//                 required
//                 className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="아이디 (아무거나 입력)"
//                 value={formData.username}
//                 onChange={handleChange}
//               />
//             </div>
//             <div>
//               <label
//                 htmlFor="password"
//                 className="sr-only"
//               >
//                 비밀번호
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 required
//                 className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="비밀번호 (아무거나 입력)"
//                 value={formData.password}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           {error && <div className="text-red-500 text-sm text-center">{error}</div>}

//           <button
//             type="submit"
//             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//           >
//             테스트 입장
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default TestLoginPage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginForm {
  username: string;
  password: string;
}

function TestLoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateConsistentMemberId = (username: string) => {
    // 문자열의 각 문자의 ASCII 코드 값을 합산
    const sum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // 1부터 1000 사이의 숫자로 변환
    return (sum % 1000) + 1;
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const memberId = generateConsistentMemberId(formData.username);
  //     localStorage.setItem('memberId', String(memberId));
  //     localStorage.setItem('nickname', `테스트유저${memberId}`);
  //     console.log(memberId);
  //     navigate('/test-lobby');
  //   } catch (err) {
  //     setError('로그인 실패');
  //   }
  // };
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const memberId = generateConsistentMemberId(formData.username);
  //     // participant 정보도 함께 저장
  //     const userInfo = {
  //       memberId: String(memberId),
  //       nickname: formData.username, // 실제 입력한 username 사용
  //       isHost: false,
  //       isReady: false,
  //     };
  //     localStorage.setItem('memberId', String(memberId));
  //     localStorage.setItem('userInfo', JSON.stringify(userInfo));
  //     navigate('/test-lobby');
  //   } catch (err) {
  //     setError('로그인 실패');
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const memberId = generateConsistentMemberId(formData.username);
      localStorage.setItem('memberId', String(memberId));
      localStorage.setItem('username', formData.username); // username 저장 추가
      navigate('/test-lobby');
    } catch (err) {
      setError('로그인 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600">테스트 로그인</h2>
          <p className="mt-2 text-gray-400">아무 정보나 입력하세요</p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="sr-only"
              >
                사용자 이름
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="아이디 (아무거나 입력)"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="sr-only"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="비밀번호 (아무거나 입력)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            테스트 입장
          </button>
        </form>
      </div>
    </div>
  );
}

export default TestLoginPage;
