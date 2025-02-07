import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectWebSocket, sendChatMessage } from '@/api/webSocket';
import TestRoomApi from '../../api/TestRoomApi';
import { Room, GameStartResponse } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import TestGameHeader from '../../components/test_gameroom/TestGameHeader';
import TestChatWindow from '../../components/test_gameroom/TestChatWindow';
import TestWaitingRoom from '../../components/test_gameroom/TestWaitingRoom';
import { Player } from '../../types/player';

// interface Player {
//   id: number;
//   nickname: string;
//   isHost: boolean;
//   isReady: boolean;
// }

function TestGameRoom(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
  const [maxPlayers] = useState<number>(8);

  useEffect(() => {
    console.log(players);
  }, [players]);

  useEffect(() => {
    setCurrentPlayerId(Number(localStorage.getItem('memberId')));
  }, []);

  useEffect(() => {
    if (gameState) {
      const currentUserId = Number(localStorage.getItem('memberId'));
      const { hostId, participant } = gameState;

      const playersList: Player[] = [];

      if (hostId) {
        playersList.push({
          id: hostId,
          hostId,
          nickname: `테스트유저${hostId}`,
          isHost: true,
          isReady: false,
        });
      }

      if (currentUserId !== hostId) {
        playersList.push({
          id: currentUserId,
          hostId,
          nickname: localStorage.getItem('username') || `테스트유저${currentUserId}`,
          isHost: false,
          isReady: participant ? participant[currentPlayerId].ready : false,
        });
      }

      if (participant) {
        Object.entries(participant).forEach(([_, p]) => {
          if (p.memberId !== hostId && p.memberId !== currentUserId) {
            playersList.push({
              id: p.memberId,
              hostId,
              nickname: p.nickName,
              isHost: false,
              isReady: p.ready || false,
            });
          }
        });
      }

      setPlayers(playersList);
      setIsHost(hostId === currentUserId);
    }
  }, [gameState]);

  useEffect(() => {
    if (!roomId) return () => {};

    const stompClient = connectWebSocket(
      // roomId,
      (message) => {
        setMessages((prev) => [...prev, message]);
      },
      // (newGameState) => {
      //   if (newGameState) {
      //     const convertedGameState: Room = {
      //       ...newGameState,
      //       roomTitle: gameState?.roomTitle || '',
      //       roomOption: gameState?.roomOption || '',
      //       maxPlayers: gameState?.maxPlayers || 8,
      //       isVoice: gameState?.isVoice || false,
      //       createdAt: gameState?.createdAt || new Date().toISOString(),
      //       curPlayers: Object.keys(newGameState.participant).length,
      //     };
      //     setGameState(convertedGameState);
      //   }
      // },
    );

    const fetchRoomInfo = async () => {
      try {
        if (!roomId) return;
        const response = await TestRoomApi.getRoom(Number(roomId));
        if (response.data.isSuccess) {
          const room = response.data.result;
          if (room) {
            setGameState(room);
            // setMaxPlayers(room.gameOption?.maxPlayers || 8);
          } else {
            // 방을 찾지 못했을 경우 로비로 이동
            navigate('/game-lobby');
          }
        }
      } catch (error) {
        console.error('Failed to fetch room info:', error);
      }
    };

    // fetchRoomInfo();

    const interval = setInterval(() => {
      fetchRoomInfo();
    }, 100);

    return () => {
      stompClient?.deactivate();
      clearInterval(interval);
    };
  }, [roomId, navigate]);

  const handleLeaveRoom = async () => {
    try {
      if (!roomId) return;
      const memberId = Number(localStorage.getItem('memberId'));
      const response = await TestRoomApi.leaveRoom(Number(roomId), memberId);

      if (response.data.isSuccess) {
        navigate('/test-lobby');
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
      navigate('/test-lobby');
    }
  };

  const handleReadyState = async () => {
    try {
      if (!roomId) return;
      const memberId = Number(localStorage.getItem('memberId'));
      const response = await TestRoomApi.readyRoom(Number(roomId), memberId);
      if (response.data.isSuccess) {
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
      const memberId = Number(localStorage.getItem('memberId'));
      const response = await TestRoomApi.startGame(Number(roomId), memberId);
      if (response.data.isSuccess) {
        const gameStartData = response.data.result as GameStartResponse;
        const convertedGameState: Room = {
          roomId: gameStartData.roomId,
          roomTitle: gameState?.roomTitle || '',
          roomStatus: gameStartData.roomStatus,
          roomOption: gameState?.roomOption || '',
          maxPlayers: gameState?.maxPlayers || 8,
          isVoice: gameState?.isVoice || false,
          createdAt: gameState?.createdAt || new Date().toISOString(),
          curPlayers: Object.keys(gameStartData.participant).length,
          hostId: gameStartData.hostId,
          participant: gameStartData.participant,
        };
        setGameState(convertedGameState);
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

    sendChatMessage(newMessage);
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
        <TestGameHeader
          roomId={roomId || ''}
          gameState={gameState}
          onLeave={handleLeaveRoom}
          // onReady={handleReadyState}
          // onStart={handleGameStart}
          // isHost={isHost}
        />

        <div className="flex h-full gap-4 pt-16">
          <div className="flex-1">
            {!gameState?.roomStatus && (
              <TestWaitingRoom
                players={players}
                isHost={isHost}
                // currentPlayerId={currentPlayerId}
                maxPlayers={maxPlayers}
                onReady={handleReadyState}
                onStart={handleGameStart}
              />
            )}
          </div>

          <TestChatWindow
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

export default TestGameRoom;
