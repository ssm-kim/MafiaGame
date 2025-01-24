import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

interface LoginFormData {
   username: string;
   password: string;
}

interface NicknameModalProps {
 show: boolean;
 onClose: () => void;
 onSubmit: (nickname: string) => void;
}

const NicknameModal: React.FC<NicknameModalProps> = ({ show, onClose, onSubmit }) => {
 const [nickname, setNickname] = useState('');

 const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   onSubmit(nickname);
 };

 if (!show) return null;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
     <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
       <h2 className="text-2xl font-bold text-red-500 mb-6 text-center" style={{ fontFamily: 'BMEuljiro10yearslater' }}>
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
         <div className="flex gap-2 mt-4">
           <button
             type="button"
             onClick={onClose}
             className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
           >
             취소
           </button>
           <button
             type="submit"
             className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
           >
             확인
           </button>
         </div>
       </form>
     </div>
   </div>
 );
};

const LoginPage: React.FC = () => {
   const navigate = useNavigate();
   const [isLogin, setIsLogin] = useState(true);
   const [showNicknameModal, setShowNicknameModal] = useState(false);
   const [formData, setFormData] = useState<LoginFormData>({
       username: "",
       password: "",
   });
   const [error, setError] = useState<string>("");

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const {name, value} = e.target;
       setFormData(prev => ({
           ...prev,
           [name]: value,
       }));
   };

//    const handleSubmit = async (e: React.FormEvent) => {
//        e.preventDefault();
//        setError("");

//        try {
//            // TODO: 실제 로그인 API 연동
//            const response = await loginApi(formData);
//            if (!response.data.hasNickname) {
//                setShowNicknameModal(true);
//            } else {
//                navigate("/game-lobby");
//            }
//        } catch (err) {
//            setError(isLogin ? "로그인에 실패했습니다." : "회원가입에 실패했습니다.");
//        }
//    };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
 
    try {
        // 실제 로그인 전에 바로 모달 띄우기 (테스트용)
        setShowNicknameModal(true);
        // TODO: 실제 로그인 로직은 나중에 구현
        // const response = await loginApi(formData);
        // if (!response.data.hasNickname) {
        //     setShowNicknameModal(true);
        // } else {
        //     navigate("/game-lobby");
        // }
    } catch (err) {
        setError(isLogin ? "로그인에 실패했습니다." : "회원가입에 실패했습니다.");
    }
 };

//    const handleNicknameSubmit = async (nickname: string) => {
//        try {
//            await axios.post('/api/member/nickname', { nickname });
//            setShowNicknameModal(false);
//            navigate("/game-lobby");
//        } catch (err) {
//            setError("닉네임 설정에 실패했습니다.");
//        }
//    };

const handleNicknameSubmit = async (nickname: string) => {
    try {
        // API 연동 전 임시 처리
        setShowNicknameModal(false);
        navigate("/game-lobby");
        // 실제 API 연동 코드
        // await axios.post('/api/member/nickname', { nickname });
    } catch (err) {
        setError("닉네임 설정에 실패했습니다.");
    }
 };

   return (
       <div 
           className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
           style={{
               backgroundImage: 'url("/images/splash_background.jpg")'
           }}
       >
           <div className="absolute inset-0 bg-black bg-opacity-60"></div>
           
           <div className="max-w-md w-full space-y-8 bg-gray-900 bg-opacity-90 p-8 rounded-lg shadow-2xl border-2 border-gray-800 relative z-10">
               <div className="text-center">
                   <h2 
                       className="text-4xl font-bold text-red-500 mb-2"
                       style={{ fontFamily: 'BMEuljiro10yearslater' }}
                   >
                       {isLogin ? "생존자 로그인" : "생존자 등록"}
                   </h2>
                   <p className="text-gray-400 text-sm">
                       {isLogin 
                           ? "학교에 돌아오신 것을 환영합니다" 
                           : "새로운 생존자 등록이 필요합니다"}
                   </p>
               </div>

               <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                   <div className="space-y-4">
                       <div>
                           <label htmlFor="username" className="text-sm text-gray-300 mb-1 block">생존자 이메일</label>
                           <input 
                               id="username"
                               name="username"
                               type="text"
                               required
                               className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                               placeholder="이메일을 입력하세요" 
                               value={formData.username}
                               onChange={handleChange}
                           />
                       </div>
                       <div>
                           <label htmlFor="password" className="text-sm text-gray-300 mb-1 block">비밀번호</label>
                           <input 
                               id="password"
                               name="password"
                               type="password"
                               required
                               className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                               placeholder="비밀번호를 입력하세요"
                               value={formData.password}
                               onChange={handleChange}
                           />
                       </div>
                   </div>

                   {error && (
                       <div className="text-red-500 text-sm text-center bg-red-900 bg-opacity-20 py-2 rounded">
                           {error}
                       </div>
                   )}

                   <div className="flex flex-col gap-3">
                       <button
                           type="submit"
                           className="w-full py-3 px-4 rounded font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                       >
                           {isLogin ? "입장하기" : "등록하기"}
                       </button>
                       <button className="w-full py-2">
                           <img 
                               src="/images/naver_login.png" 
                               alt="네이버 로그인" 
                               className="w-full max-w-[50px] mx-auto"
                           />
                       </button>
                       <button
                           type="button"
                           onClick={() => setIsLogin(!isLogin)}
                           className="w-full py-2 px-4 rounded font-medium text-gray-400 hover:text-white focus:outline-none transition-colors duration-200"
                       >
                           {isLogin 
                               ? "아직 등록하지 않으셨나요? 생존자 등록하기" 
                               : "이미 등록하셨나요? 로그인하기"}
                       </button>
                   </div>
               </form>
           </div>

           <NicknameModal
               show={showNicknameModal}
               onClose={() => setShowNicknameModal(false)}
               onSubmit={handleNicknameSubmit}
           />
       </div>
   );
}

export default LoginPage;