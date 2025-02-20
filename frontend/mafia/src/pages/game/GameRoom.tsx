import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StompSubscription } from '@stomp/stompjs';
import roomApi from '@/api/roomApi';
import { Room, ParticipantMap } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import GameHeader from '@/components/gameroom/GameHeader';
import ChatWindow from '@/components/gameroom/ChatWindow';
import WaitingRoom from '@/components/gameroom/WaitingRoom';
import { Player } from '@/types/player';
// import VoiceChat from '@/components/gameroom/VoiceChat';
import GameComponent from '@/game/GameComponent';

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
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState<Room | null>(null);
  const [participantNo, setParticipantNo] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ParticipantMap | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentNickname, setCurrentNickname] = useState<string>('');
  const [requiredPlayers, setRequiredPlayers] = useState<number>(8);
  const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');
  const stompClientRef = useRef<any>(null);

  const [activeSubscriptions, setActiveSubscriptions] = useState<StompSubscription[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const phaserEventEmitter = useRef(new Phaser.Events.EventEmitter());

  useEffect(() => {
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

  const handleMessage = (type: string, message: string) => {
    // console.log('Message type:', type);
    // console.log('Raw message:', message);
    const parsedMessage = JSON.parse(message);
    // console.log('Parsed message:', parsedMessage);

    setMessages((prev) => [
      ...prev,
      {
        id: parsedMessage.messageId || Date.now().toString(),
        content: parsedMessage.content,
        senderName: type === 'SYSTEM' ? 'SYSTEM' : parsedMessage.nickname || parsedMessage.sender,
        timestamp: parsedMessage.sendTime || parsedMessage.timestamp || new Date().toISOString(),
        type,
      } as ChatMessage,
    ]);
  };

  useEffect(() => {
    if (!participants) return;

    const playersList: Player[] = [];

    let currentParticipant;
    Object.entries(participants).forEach(([_, p]) => {
      if (p.participantNo === participantNo) {
        currentParticipant = p;
      }
    });

    if (currentParticipant && participantNo !== null) {
      setIsHost(participantNo === 1);
    }

    Object.entries(participants).forEach(([id, p]) => {
      if (p) {
        playersList.push({
          id: Number(id),
          nickname: p.nickname,
          isHost: p.participantNo === 1,
          isReady: p.ready || false,
          participantNo: p.participantNo,
        });
      }
    });

    setPlayers(playersList);
  }, [participants, participantNo]);

  useEffect(() => {
    if (!stompClientRef.current) return;

    activeSubscriptions.forEach((activeSubs) => {
      activeSubs.unsubscribe();
    });

    if (gameState?.roomStatus === 'PLAYING') {
      const newActiveSubs: StompSubscription[] = [];

      subscriptions.forEach((subscription) => {
        const newActiveSub = stompClientRef.current.subscribe(
          `/topic/${subscription}`,
          (msg: { body: string }) => {
            if (subscription.includes('system')) {
              const data = JSON.parse(msg.body);
              if (data.phase && data.time) {
                if (currentChatType === 'DEAD') return;
                setCurrentChatType(data.phase === 'NIGHT_ACTION' ? 'NIGHT' : 'DAY');
              }
              phaserEventEmitter.current.emit('SYSTEM_MESSAGE', data);
              return;
            }

            handleMessage(currentChatType, msg.body);
          },
        );

        newActiveSubs.push(newActiveSub);
      });

      setActiveSubscriptions(newActiveSubs);
    }
  }, [roomId, gameState?.roomStatus, subscriptions]);

  useEffect(() => {
    let roomSubscription: any = null;
    let chatSubscription: any = null;

    const initializeRoom = async () => {
      try {
        if (!roomId) return;

        await roomApi.initializeWebSocket();
        const stompClient = roomApi.getStompClient();
        stompClientRef.current = stompClient;

        // 참가자 번호 조회
        const responseMyNum = await roomApi.getRoomParticipantNo(Number(roomId));
        if (responseMyNum.data.isSuccess) {
          const { myParticipantNo } = responseMyNum.data.result;
          setParticipantNo(myParticipantNo);
        }

        if (stompClient) {
          roomSubscription = roomApi.subscribeRoom(Number(roomId), async (message) => {
            // 먼저 message가 null인지 확인
            if (!message) {
              alert('방이 삭제되었습니다.');
              navigate('/game-lobby');
              return;
            }

            // 게임 시작 메시지 체크
            if ('gameStart' in message && message.gameStart === 'true') {
              try {
                const response = await axios.get(`/api/game/${roomId}`);
                if (response.data.isSuccess) {
                  // 상태를 한 번에 업데이트
                  setGameState({
                    ...response.data.result,
                    roomStatus: 'PLAYING', // roomStatus를 명시적으로 설정
                  });
                  setSubscriptions(response.data.result.myInfo.subscriptions);
                  console.log('Game started with state:', response.data.result);
                }
              } catch (error) {
                console.error('Failed to fetch game info:', error);
              }
              return;
            }

            // 방장 체크
            let isHostLeft = true;
            Object.values(message as ParticipantMap).forEach((participantInfo) => {
              if (participantInfo.participantNo === 1) {
                isHostLeft = false;
              }
            });

            if (isHostLeft) {
              alert('방장이 나가서 방이 삭제되었습니다.');
              navigate('/game-lobby');
              return;
            }

            // 내 참가자 정보 체크
            const myNewInfo = Object.values(message).find((p) => p.participantNo === participantNo);
            if (!myNewInfo) {
              alert('강제 퇴장 당하였습니다.');
              navigate('/game-lobby');
              return;
            }

            setParticipants(message as ParticipantMap);
          });

          chatSubscription = stompClient.subscribe(
            `/topic/room-${roomId}-chat`,
            (msg: { body: string }) => handleMessage('ROOM', msg.body),
          );

          await roomApi.joinRoom(Number(roomId));
        }

        const response = await roomApi.getRoom(Number(roomId));
        if (response.data.isSuccess) {
          const room = response.data.result;
          if (room) {
            setGameState(room);
            setRequiredPlayers(room.requiredPlayers);
            try {
              // console.log('채팅 내역 요청 시작');
              const chatResponse = await axios.get(`/api/chat`, {
                params: {
                  gameId: roomId,
                  chatType: 'room',
                  count: 50,
                },
              });
              console.log('채팅 API 응답:', chatResponse);

              if (chatResponse?.data?.isSuccess) {
                // console.log('채팅 데이터:', chatResponse.data.result);
                if (Array.isArray(chatResponse.data.result)) {
                  setMessages(chatResponse.data.result);
                } else {
                  // console.log('채팅 데이터가 배열이 아님:', chatResponse.data.result);
                }
              } else {
                console.log('채팅 API 실패:', chatResponse?.data);
              }
            } catch (error) {
              console.error('채팅 요청 에러:', error);
            }
          } else {
            navigate('/game-lobby');
          }
        }
      } catch (error) {
        console.error('Failed to initialize room:', error);
        navigate('/game-lobby');
      }
    };

    initializeRoom();

    return () => {
      if (roomSubscription) roomSubscription.unsubscribe();
      if (chatSubscription) chatSubscription.unsubscribe();
      window.sessionStorage.removeItem(`room-${roomId}-entered`);
      roomApi.disconnect();
    };
  }, [roomId, navigate, participantNo]);

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
            player.participantNo === participantNo
              ? { ...player, isReady: !player.isReady }
              : player,
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
    if (!newMessage.trim() || !roomId || !stompClientRef.current) return;

    // console.log(currentChatType);

    stompClientRef.current.send(
      '/app/chat/send',
      {},
      JSON.stringify({
        gameId: roomId,
        content: newMessage,
        chatType: currentChatType,
      }),
    );

    setNewMessage('');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="h-screen bg-cover bg-center bg-fixed hover:cursor-default"
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
            {!gameState?.roomStatus ? (
              <WaitingRoom
                players={players}
                isHost={isHost}
                requiredPlayers={requiredPlayers}
                onReady={handleReadyState}
                onStart={handleGameStart}
                roomId={Number(roomId)}
                participantNo={participantNo}
              />
            ) : (
              <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
                <GameComponent
                  roomId={roomId}
                  playerNo={participantNo}
                  stompClient={stompClientRef.current}
                  eventEmitter={phaserEventEmitter.current}
                  setSubscriptions={setSubscriptions}
                  setShowGame={() => {
                    setGameState((prevState) => ({
                      roomId: prevState?.roomId ?? 0,
                      roomTitle: prevState?.roomTitle ?? '',
                      initParticipantNo: prevState?.initParticipantNo ?? 0,
                      roomStatus: null as any,
                      roomOption: prevState?.roomOption ?? '',
                      requiredPlayers: prevState?.requiredPlayers ?? 0,
                      isVoice: prevState?.isVoice ?? false,
                      createdAt: prevState?.createdAt ?? '',
                      peopleCnt: prevState?.peopleCnt ?? 0,
                      hostId: prevState?.hostId ?? 0,
                      hasPassword: prevState?.hasPassword ?? false,
                      participant: prevState?.participant ?? {},
                      isNight: prevState?.isNight,
                      myInfo: prevState?.myInfo,
                    }));
                  }}
                />
                {/* <VoiceChat
                  nickname={currentNickname}
                  gameState={gameState}
                /> */}
              </div>
            )}
          </div>
          <ChatWindow
            messages={messages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            chatType={currentChatType}
            currentNickname={currentNickname}
          />
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
