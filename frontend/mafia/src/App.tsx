import React from 'react';
import "./index.css"
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Splash from './components/splash/Splash';
import LoginPage from './pages/login/LoginPage';
import GameLobby from './components/game/GameLobby';
import GameRoom from './components/game/GameRoom'
import UserNickname from './components/user/UserNickname';
const App: React.FC = () => {
  return (
    <div className='w-full h-screen'>
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />}></Route>
        <Route path="/login" element={<LoginPage />}></Route>
        <Route path="/game-lobby" element={<GameLobby />}></Route>
        <Route path="/game/:roomId" element={<GameRoom />} />
        <Route path="nickname" element={<UserNickname />} />
      </Routes>
     </BrowserRouter>
    </div>
  );

};
export default App;
