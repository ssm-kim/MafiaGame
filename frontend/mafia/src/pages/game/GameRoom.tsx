/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectWebSocket, sendChatMessage } from '@/api/webSocket';
import roomApi from '@/api/roomApi';
import { Room } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import GameHeader from '@/components/gameroom/GameHeader';
import GameStatus from '@/components/gameroom/GameStatus';
import ChatWindow from '@/components/gameroom/ChatWindow';

interface GameRoomParams {
  roomId: string;
}

function GameRoom(): JSX.Element {
  const { roomId } = useParams<GameRoomParams>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState<Room | null>(null);
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  const [players] = useState([
    { id: '1', name: '생존자 1' },
    { id: '2', name: '생존자 2' },
    { id: '3', name: '생존자 3' },
    { id: '4', name: '생존자 4' },
  ]);

  useEffect(() => {
    // 빈 cleanup 함수를 반환하여 타입 일관성 유지
    if (!roomId) return () => {};

    const stompClient = connectWebSocket(
      roomId,
      (message) => {
        setMessages((prev) => [...prev, message]);
      },
      (newGameState) => {
        setGameState(newGameState);
      },
    );

    const fetchRoomInfo = async () => {
      try {
        const response = await roomApi.getRoom(roomId);
        setGameState(response.data.result);
      } catch (error) {
        console.error('Failed to fetch room info:', error);
      }
    };

    fetchRoomInfo();

    // cleanup 함수 반환
    return () => {
      stompClient?.deactivate();
    };
  }, [roomId]);

  const handleLeaveRoom = async () => {
    try {
      if (roomId) {
        await roomApi.leaveRoom(roomId);
        navigate('/game-lobby');
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleReadyState = async () => {
    try {
      if (roomId) {
        await roomApi.readyRoom(roomId);
      }
    } catch (error) {
      console.error('Failed to change ready state:', error);
    }
  };

  const handleGameStart = async () => {
    try {
      if (roomId) {
        await roomApi.startGame(roomId);
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    sendChatMessage(roomId, newMessage);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderName: '나',
        content: newMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage('');
  };

  return (
    <div
      className="h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url("/images/splash_background.jpg")' }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-70" />

      <div className="relative h-full z-10 p-4">
        <GameHeader
          roomId={roomId || ''}
          gameState={gameState}
          onLeave={handleLeaveRoom}
          onReady={handleReadyState}
          onStart={handleGameStart}
        />

        <div className="flex h-full gap-4 pt-16">
          <div className="flex-1">
            <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
              {gameState ? (
                <div className="relative h-full">
                  <div className="absolute inset-0">{/* 게더타운 컴포넌트 */}</div>
                  <GameStatus
                    gameState={gameState}
                    players={players}
                    voteTarget={voteTarget}
                    onVoteSelect={setVoteTarget}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div
                    className="text-red-500 text-2xl animate-pulse"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    시설 점검 중...
                  </div>
                </div>
              )}
            </div>
          </div>

          <ChatWindow
            messages={messages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
