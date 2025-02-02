import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectWebSocket, sendChatMessage } from '@/api/webSocket';
import roomApi from '@/api/roomApi';
import { Room } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import GameHeader from '@/components/gameroom/GameHeader';
import GameStatus from '@/components/gameroom/GameStatus';
import ChatWindow from '@/components/gameroom/ChatWindow';
import WaitingRoom from '@/components/gameroom/WaitingRoom';

interface Player {
  id: number;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
}

function GameRoom(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);

  useEffect(() => {
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
        if (!roomId) return;

        const response = await roomApi.getRoom(Number(roomId));
        if (response.data.isSuccess) {
          setGameState(response.data.result);
          // 임시 플레이어 데이터 설정 (실제로는 API에서 받아와야 함)
          setPlayers([
            {
              id: 1,
              nickname: '방장',
              isHost: true,
              isReady: true,
            },
            {
              id: 2,
              nickname: '플레이어2',
              isHost: false,
              isReady: false,
            },
          ]);
          // 임시로 현재 플레이어 ID와 방장 여부 설정
          setCurrentPlayerId(2);
          setIsHost(false);
        }
      } catch (error) {
        console.error('Failed to fetch room info:', error);
      }
    };

    fetchRoomInfo();

    return () => {
      stompClient?.deactivate();
    };
  }, [roomId]);

  const handleLeaveRoom = async () => {
    try {
      if (!roomId) return;

      const response = await roomApi.leaveRoom(Number(roomId));
      if (response.data.isSuccess) {
        navigate('/game-lobby');
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleReadyState = async () => {
    try {
      if (!roomId) return;

      const response = await roomApi.readyRoom(Number(roomId));
      if (response.data.isSuccess) {
        // 플레이어의 준비 상태 업데이트
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === currentPlayerId ? { ...player, isReady: !player.isReady } : player,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to change ready state:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        alert('플레이어를 찾을 수 없습니다.');
      }
    }
  };

  const handleGameStart = async () => {
    try {
      if (!roomId) return;

      const response = await roomApi.startGame(Number(roomId));
      if (response.data.isSuccess) {
        setGameState(response.data.result);
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert('모든 참가자가 준비를 완료하지 않았습니다.');
      }
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
          isHost={isHost}
        />

        <div className="flex h-full gap-4 pt-16">
          <div className="flex-1">
            {gameState?.roomStatus ? (
              <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
                <GameStatus gameState={gameState} />
              </div>
            ) : (
              <WaitingRoom
                players={players}
                isHost={isHost}
                currentPlayerId={currentPlayerId}
                onReady={handleReadyState}
                onStart={handleGameStart}
              />
            )}
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
