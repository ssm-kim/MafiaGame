// import React from 'react';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Splash from './components/splash/Splash';
import LoginPage from './pages/login/LoginPage';
import GameLobby from './pages/lobby/GameLobby';
import GameRoom from './pages/game/GameRoom';
import BGMPlayer from './components/backgrondbgm/BGMPlayer';
import RankingPage from './components/lobby/RankingPage';

function App(): JSX.Element {
  return (
    <div className="w-full h-screen">
      <BrowserRouter>
        <BGMPlayer />
        <Routes>
          <Route
            path="/"
            element={<Splash />}
          />
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/login/success"
            element={<LoginPage />}
          />
          <Route
            path="/game-lobby"
            element={<GameLobby />}
          />
          <Route
            path="/game/:roomId"
            element={<GameRoom />}
          />
          <Route
            path="/rank"
            element={<RankingPage />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
