import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types/user"

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState<User>({
        username: "",
        password: "",
    });
    const [error, setError] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            navigate("/game-lobby")
        } catch (err) {
            setError(isLogin ? "로그인에 실패했습니다." : "회원가입에 실패했습니다.");
        }
    }

    return (
        <div 
            className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: 'url("/images/splash_background.jpg")'
            }}
        >
            {/* 어두운 오버레이 */}
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
                            <label htmlFor="username" className="text-sm text-gray-300 mb-1 block">생존자 이름</label>
                            <input 
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="이름을 입력하세요" 
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
        </div>
    );
}

export default LoginPage;