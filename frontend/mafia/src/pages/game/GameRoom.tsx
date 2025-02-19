import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CompatClient } from '@stomp/stompjs';
import roomApi from '@/api/roomApi';
import { Room, ParticipantMap } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import GameHeader from '@/components/gameroom/GameHeader';
import ChatWindow from '@/components/gameroom/ChatWindow';
import WaitingRoom from '@/components/gameroom/WaitingRoom';
import { Player } from '@/types/player';
import GameComponent from '@/game/GameComponent';
import useWebSocket from '@/hooks/useWebSocket';
import api from '@/api/axios';

export interface Participant {
  memberId: number;
  nickName: string;
  ready: boolean;
  participantNo: number;
  isHost: boolean;
  subscriptions?: string[];
  isDead?: boolean;
}

function GameRoom(): JSX.Element {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [gameState, setGameState] = useState<Room | null>(null);
  const [participantNo, setParticipantNo] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ParticipantMap | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentNickname, setCurrentNickname] = useState<string>('');
  const [requiredPlayers, setRequiredPlayers] = useState<number>(8);

  const [showGame, setShowGame] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const eventEmitter = useRef<Phaser.Events.EventEmitter>(new Phaser.Events.EventEmitter());
  const webSocket = useWebSocket(roomId);

  useEffect(() => {
    const fetchPlayerNo = async () => {
      const response = await api.get(`/api/room/${roomId}/enter`);

      const playerNo = response.data.result.myParticipantNo;

      setParticipantNo(playerNo);
      setIsHost(playerNo === 1);
    };

    fetchPlayerNo();
  }, []);

  useEffect(() => {
    // 닉네임 가져오기
    const fetchNickname = async () => {
      try {
        const response = await axios.get('/api/member');
        if (response.data.isSuccess) {
          const { nickname } = response.data.result;
          setCurrentNickname(nickname);
        }
      } catch (error) {
        console.error('Failed to fetch nickname:', error);
      }
    };
    fetchNickname();
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // 방 정보 가져오기
    const fetchRoomInfo = async () => {
      try {
        const response = await roomApi.getRoom(Number(roomId));

        console.log(response);

        if (response.data.isSuccess) {
          const roomInfo = response.data.result;
          setGameState(roomInfo);
          setRequiredPlayers(roomInfo.requiredPlayers);
        }
      } catch (error) {
        console.error('Failed to fetch room information:', error);
        navigate('/game-lobby');
      }
    };

    // 이전 채팅 내역 가져오기
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`/api/chat`, {
          params: {
            gameId: roomId,
            chatType: 'room', // 소문자로 변경
            count: 50,
          },
        });

        if (response.data.isSuccess) {
          const chatHistories = chatResponse.data.result;
          setMessages(chatHistories);
        }
      } catch (error) {
        console.error('Failed to fetch chat histories:', error);
      }
    };

    fetchRoomInfo();
    fetchChatHistory();
  }, [roomId]);

  useEffect(() => {
    if (!participants) return;

    const playersList: Player[] = [];

    Object.entries(participants).forEach(([id, p]) => {
      playersList.push({
        id: Number(id),
        nickname: p.nickname,
        isHost: p.participantNo === 1,
        isReady: p.ready || false,
        participantNo: p.participantNo,
      });
    });

    setPlayers(playersList);
  }, [participants]);

  const handleMessage = (newMessage: ChatMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    if (!webSocket.stompClient?.connected || !participantNo) return;

    // 방 구독
    webSocket.room.subscribeRoom(participantNo, (message, gameStateChanged) => {
      if (gameStateChanged) {
        setShowGame(true);

        setGameState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            roomStatus: 'PLAYING',
          };
        });

        return;
      }

      setParticipants(message);
    });

    // 방 입장 메시지 송신
    webSocket.room.enterRoom();

    // 시스템 채팅 구독
    webSocket.chatting.subscribeSystemChat((message) => {
      eventEmitter.current?.emit('SYSTEM_MESSAGE', message);
    });

    // 방 채팅 구독
    webSocket.chatting.subscribeRoomChat(handleMessage);
  }, [webSocket.isConnected, participantNo]);

  useEffect(() => {
    // if (gameState?.roomStatus === 'PLAYING' && gameState.participant[currentNickname]) {
    // const subscriptions = gameState.participant[currentNickname]?.subscriptions || [];
    if (!subscriptions) return;

    console.log(subscriptions);
    webSocket.chatting.subscribeTopics(subscriptions, true, (newMessage) => {
      handleMessage(newMessage);
    });
    // }
  }, [subscriptions]);

  const handleLeaveRoom = async () => {
    try {
      if (!roomId || participantNo == null) return;
      const response = await roomApi.leaveRoom(Number(roomId));
      if (response.data.isSuccess) {
        navigate('/game-lobby');
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
      navigate('/game-lobby');
    }
  };

  const handleReadyState = async () => {
    try {
      if (!roomId || participantNo == null) return;
      const response = await roomApi.readyRoom(Number(roomId));
      if (response.data.isSuccess) {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.nickname === currentNickname ? { ...player, isReady: !player.isReady } : player,
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
      if (!roomId || participantNo == null) return;

      const nonHostPlayers = players.filter((p) => !p.isHost);
      const allPlayersReady = nonHostPlayers.every((p) => p.isReady);

      if (!allPlayersReady) {
        alert('모든 참가자가 준비를 완료해야 합니다.');
        return;
      }

      await roomApi.startGame(Number(roomId));
    } catch (error) {
      console.error('Failed to start game:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('게임 시작에 실패했습니다.');
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || !roomId || !webSocket.stompClient?.connected) return;

    webSocket.chatting.sendMessage(userMessage);

    setUserMessage('');
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
        />

        <div className="flex h-full gap-4 pt-16">
          <div className="flex-1">
            {showGame ? (
              <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
                <GameComponent
                  roomId={roomId}
                  playerNo={participantNo}
                  stompClient={webSocket.stompClient}
                  eventEmitter={eventEmitter.current}
                  setSubscriptions={setSubscriptions}
                  setShowGame={setShowGame}
                />
              </div>
            ) : (
              <WaitingRoom
                players={players}
                isHost={isHost}
                requiredPlayers={requiredPlayers}
                onReady={handleReadyState}
                onStart={handleGameStart}
                roomId={Number(roomId)}
              />
            )}
          </div>
          <ChatWindow
            messages={messages}
            newMessage={userMessage}
            onMessageChange={setUserMessage}
            onSendMessage={handleSendMessage}
            chatType={webSocket.chatting.chatType}
            currentNickname={currentNickname}
          />
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
