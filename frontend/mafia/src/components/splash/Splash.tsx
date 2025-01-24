import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


const Splash: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div 
            className="h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
            style={{
                backgroundImage: 'url("/images/splash_background.jpg")'
            }}
        >
            
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            
            <div className="text-center relative z-10">
                <h1 className="text-7xl font-bold text-white mb-4"
                 style={{ fontFamily: 'BMEuljiro10yearslater' }}>
                    지금 우리 학교는
                </h1>
                {/* <div className="animate-pulse">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div> */}
            </div>
        </div>
    )
};
export default Splash;