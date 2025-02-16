import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomApi from '@/api/roomApi';
import { Room, ParticipantMap } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import GameHeader from '@/components/gameroom/GameHeader';
// import GameStatus from '@/components/gameroom/GameStatus';
import ChatWindow from '@/components/gameroom/ChatWindow';
import WaitingRoom from '@/components/gameroom/WaitingRoom';
import { Player } from '@/types/player';

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

  useEffect(() => {
    const fetchNickname = async () => {
      try {
        const response = await axios.get('/api/member');
        if (response.data.isSuccess) {
          const { nickname } = response.data.result;
          setCurrentNickname(nickname);
          console.log('API에서 가져온 nickname:', nickname);
        }
      } catch (error) {
        console.error('Failed to fetch nickname:', error);
      }
    };
    fetchNickname();
  }, []);

  const handleMessage = (type: string, message: string) => {
    console.log('Message type:', type);
    console.log('Raw message:', message);
    const parsedMessage = JSON.parse(message);
    console.log('Parsed message:', parsedMessage);

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

    console.log('----------------');
    console.log('participants 업데이트:', participants);
    console.log('currentNickname:', currentNickname);
    console.log('현재 isHost 상태:', isHost);

    const playersList: Player[] = [];

    // nickname으로 현재 플레이어를 찾습니다
    let currentParticipant;
    Object.entries(participants).forEach(([_, p]) => {
      if (p.nickname === currentNickname) {
        currentParticipant = p;
      }
    });

    if (currentParticipant && participantNo === null) {
      setParticipantNo((currentParticipant as Participant).participantNo);
      setIsHost((currentParticipant as Participant).participantNo === 1);
    }

    Object.entries(participants).forEach(([id, p]) => {
      if (p && p.nickname) {
        playersList.push({
          id: Number(id),
          nickname: p.nickname,
          isHost: p.participantNo === 1,
          isReady: p.ready || false,
          participantNo: p.participantNo,
        });
      }
    });

    console.log('생성된 playersList:', playersList);
    setPlayers(playersList);
  }, [participants, currentNickname]);

  useEffect(() => {
    if (!stompClientRef.current) return;

    if (gameState?.roomStatus === 'PLAYING' && gameState.participant[currentNickname]) {
      const playerSubscriptions = gameState.participant[currentNickname].subscriptions || [];

      playerSubscriptions.forEach((subscription) => {
        if (subscription.includes('day')) {
          stompClientRef.current.subscribe(
            `/topic/game-${roomId}-day-chat`,
            (msg: { body: string }) => handleMessage('DAY', msg.body),
          );
          setCurrentChatType('DAY');
        }
        if (subscription.includes('night')) {
          stompClientRef.current.subscribe(
            `/topic/game-${roomId}-night-chat`,
            (msg: { body: string }) => handleMessage('NIGHT', msg.body),
          );
          setCurrentChatType('NIGHT');
        }
        if (subscription.includes('dead')) {
          stompClientRef.current.subscribe(
            `/topic/game-${roomId}-dead-chat`,
            (msg: { body: string }) => handleMessage('DEAD', msg.body),
          );
          setCurrentChatType('DEAD');
        }
        if (subscription.includes('system')) {
          stompClientRef.current.subscribe(
            `/topic/game-${roomId}-system`,
            (msg: { body: string }) => handleMessage('SYSTEM', msg.body),
          );
        }
      });
    }
  }, [roomId, gameState?.roomStatus, currentNickname]);

  useEffect(() => {
    console.log('실험----------------');
    console.log('GameRoom - isHost 상태:', isHost);
    console.log('GameRoom - players:', players);
  }, [isHost, players]);

  useEffect(() => {
    let roomSubscription: any = null;
    let chatSubscription: any = null;

    const initializeRoom = async () => {
      try {
        if (!roomId) return;

        await roomApi.initializeWebSocket();
        const stompClient = roomApi.getStompClient();
        stompClientRef.current = stompClient;

        const responseNickname = await axios.get('/api/member');
        const { nickname } = responseNickname.data.result;

        if (stompClient) {
          roomSubscription = roomApi.subscribeRoom(Number(roomId), (message) => {
            if ('gameStart' in message && message.gameStart === 'true') {
              setGameState((prevState) => {
                if (!prevState) return null;
                return {
                  ...prevState,
                  roomStatus: 'PLAYING',
                };
              });
              return;
            }

            let isHostLeft = true;
            Object.values(message as ParticipantMap).forEach((participantInfo) => {
              if (participantInfo.participantNo === 1) {
                isHostLeft = false;
              }
            });

            if (isHostLeft) return navigate('/game-lobby');

            const myNewInfo = Object.values(message).find((p) => p.nickname === nickname);

            if (!myNewInfo) {
              alert('강제 퇴장 당하였습니다.');
              navigate('/game-lobby');
            }

            if (!message) {
              alert('방이 삭제되었습니다.');
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
              console.log('채팅 내역 요청 시작');
              const chatResponse = await axios.get(`/api/chat`, {
                params: {
                  gameId: roomId,
                  chatType: 'room', // 소문자로 변경
                  count: 50,
                },
              });
              console.log('채팅 API 응답:', chatResponse);

              if (chatResponse?.data?.isSuccess) {
                console.log('채팅 데이터:', chatResponse.data.result);
                if (Array.isArray(chatResponse.data.result)) {
                  setMessages(chatResponse.data.result);
                } else {
                  console.log('채팅 데이터가 배열이 아님:', chatResponse.data.result);
                }
              } else {
                console.log('채팅 API 실패:', chatResponse?.data);
              }
            } catch (error) {
              console.log('채팅 요청 에러:', error);
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
  }, [roomId, navigate]);
  // useEffect(() => {
  //   let roomSubscription: any = null;
  //   let chatSubscription: any = null;

  //   const initializeRoom = async () => {
  //     try {
  //       if (!roomId) return;

  //       await roomApi.initializeWebSocket();
  //       const stompClient = roomApi.getStompClient();
  //       stompClientRef.current = stompClient;

  //       const responseNickname = await axios.get('/api/member');
  //       const { nickname } = responseNickname.data.result;

  //       if (stompClient) {
  //         // roomSubscription = roomApi.subscribeRoom(Number(roomId), (message) => {
  //         //   if ('gameStart' in message && message.gameStart === 'true') {
  //         //     setGameState((prevState) => ({
  //         //       // ...(gameState as Room),
  //         //       // roomStatus: 'PLAYING',
  //         //       ...prevState, // 기존의 모든 상태 유지
  //         //       roomStatus: 'PLAYING',
  //         //       participant: prevState?.participant || {},
  //         //     }));

  //         //     return;
  //         roomSubscription = roomApi.subscribeRoom(Number(roomId), (message) => {
  //           if ('gameStart' in message && message.gameStart === 'true') {
  //             setGameState((prevState) => {
  //               if (!prevState) return null; // prevState가 null이면 null 반환

  //               return {
  //                 ...prevState, // 기존 상태 모두 유지
  //                 roomStatus: 'PLAYING', // roomStatus만 변경
  //               };
  //             });
  //             return;
  //           }

  //           let isHostLeft = true;
  //           // Object.values(message).forEach((participantInfo) => {
  //           Object.values(message as ParticipantMap).forEach((participantInfo) => {
  //             if (participantInfo.participantNo === 1) {
  //               isHostLeft = false;
  //             }
  //           });

  //           if (isHostLeft) return navigate('/game-lobby');

  //           const myNewInfo = Object.values(message).find((p) => p.nickname === nickname);

  //           if (!myNewInfo) {
  //             alert('강제 퇴장 당하였습니다.');
  //             navigate('/game-lobby');
  //           }

  //           if (!message) {
  //             alert('방이 삭제되었습니다.');
  //             navigate('/game-lobby');
  //             return;
  //           }
  //           setParticipants(message as ParticipantMap);
  //         });

  //         chatSubscription = stompClient.subscribe(
  //           `/topic/room-${roomId}-chat`,
  //           (msg: { body: string }) => handleMessage('ROOM', msg.body),
  //         );

  //         await roomApi.joinRoom(Number(roomId));
  //       }

  //       const response = await roomApi.getRoom(Number(roomId));
  //       if (response.data.isSuccess) {
  //         const room = response.data.result;
  //         if (room) {
  //           setGameState(room);
  //           setRequiredPlayers(room.requiredPlayers);
  //           const chatResponse = await axios.get(`/chat?gameId=${roomId}&chatType=ROOM&count=50`);
  //           console.log('채팅 응답:', chatResponse);
  //           if (chatResponse.data.isSuccess) {
  //             setMessages(chatResponse.data.result);
  //           }
  //         } else {
  //           console.error('Failed to fetch chat history:', chatResponse.data);
  //           navigate('/game-lobby');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to initialize room:', error);
  //       navigate('/game-lobby');
  //     }
  //   };

  //   initializeRoom();

  //   return () => {
  //     if (roomSubscription) roomSubscription.unsubscribe();
  //     if (chatSubscription) chatSubscription.unsubscribe();
  //     window.sessionStorage.removeItem(`room-${roomId}-entered`);
  //     roomApi.disconnect();
  //   };
  // }, [roomId, navigate]);

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

      // const response = await roomApi.startGame(Number(roomId));
      // if (response.data.isSuccess) {
      //   const gameStartData = response.data.result as GameStartResponse;
      //   setGameState((prevState) => ({
      //     ...prevState!,
      //     roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
      //     participant: gameStartData.participant,
      //   }));
      // }
      // 지우기 가능
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
            {!gameState?.roomStatus ? (
              <WaitingRoom
                players={players}
                isHost={isHost}
                requiredPlayers={requiredPlayers}
                onReady={handleReadyState}
                onStart={handleGameStart}
                roomId={Number(roomId)}
              />
            ) : (
              <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
                {/* <GameStatus gameState={gameState} /> */}
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
