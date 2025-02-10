// import React from 'react';
import './index.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Splash from './components/splash/Splash';
import LoginPage from './pages/login/LoginPage';
import GameLobby from './pages/lobby/GameLobby';
import GameRoom from './pages/game/GameRoom';
import TestGameRoom from './pages/test_game/TestGameRoom';
import TestLobby from './pages/test_lobby/TestLobby';
import TestLoginPage from './pages/test-login/TestLogin';

function App(): JSX.Element {
  return (
      <div className="w-full h-screen">
        <BrowserRouter>
          <Routes>
            <Route
                path="/"
                element={<Splash/>}
            />
            <Route
                path="/login"
                element={<LoginPage/>}
            />
            <Route
                path="/login/success"
                element={<LoginPage/>}
            />
            <Route
                path="/game-lobby"
                element={<GameLobby/>}
            />
            <Route
                path="/game/:roomId"
                element={<GameRoom/>}
            />
            <Route
                path="/test-login"
                element={<TestLoginPage/>}
            />
            <Route
                path="/test-lobby"
                element={<TestLobby/>}
            />
            <Route
                path="/game-test/:roomId"
                element={<TestGameRoom/>}
            />
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
