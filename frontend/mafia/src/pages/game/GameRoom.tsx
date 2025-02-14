import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomApi from '@/api/roomApi';
import { Room, ParticipantMap } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import GameHeader from '@/components/gameroom/GameHeader';
import GameStatus from '@/components/gameroom/GameStatus';
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
              setGameState({
                ...(gameState as Room),
                roomStatus: 'PLAYING',
              });

              return;
            }

            let isHostLeft = true;
            Object.values(message).forEach((participantInfo) => {
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
            const chatResponse = await axios.get(`/chat?gameId=${roomId}&chatType=ROOM&count=50`);
            if (chatResponse.data.isSuccess) {
              setMessages(chatResponse.data.result);
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
                <GameStatus gameState={gameState} />
              </div>
            )}
          </div>
          <ChatWindow
            messages={messages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            chatType={currentChatType}
          />
        </div>
      </div>
    </div>
  );
}

export default GameRoom;

// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import roomApi from '@/api/roomApi';
// import { Room, GameStartResponse, ParticipantMap } from '@/types/room';
// import { ChatMessage } from '@/types/chat';
// import GameHeader from '@/components/gameroom/GameHeader';
// import GameStatus from '@/components/gameroom/GameStatus';
// import ChatWindow from '@/components/gameroom/ChatWindow';
// import WaitingRoom from '@/components/gameroom/WaitingRoom';
// import { Player } from '@/types/player';

// export interface Participant {
//   memberId: number;
//   nickName: string;
//   ready: boolean;
//   participantNo: number;
//   isHost: boolean;
//   subscriptions?: string[];
//   isDead?: boolean;
// }

// function GameRoom(): JSX.Element {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [gameState, setGameState] = useState<Room | null>(null);

//   const [participantNo, setParticipantNo] = useState<number | null>(null);
//   const [participants, setParticipants] = useState<ParticipantMap | null>(null);

//   const [players, setPlayers] = useState<Player[]>([]);
//   const [isHost, setIsHost] = useState(false);
//   const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
//   const [requiredPlayers] = useState<number>(8);
//   const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');
//   const stompClientRef = useRef<any>(null);

//   useEffect(() => {
//     // 사용하지 않음
//     // setParticipantNo(1);
//     // setIsHost(false);

//     const fetchMemberId = async () => {
//       try {
//         const response = await axios.get('/api/member');
//         if (response.data.isSuccess) {
//           const myId = response.data.result.memberId;
//           setCurrentPlayerId(myId);
//           console.log('API에서 가져온 memberId:', myId);
//         }
//       } catch (error) {
//         console.error('Failed to fetch member ID:', error);
//       }
//     };
//     fetchMemberId();
//   }, []);

//   const handleMessage = (type: string, message: string) => {
//     console.log('Message type:', type);
//     console.log('Raw message:', message);
//     const parsedMessage = JSON.parse(message);
//     console.log('Parsed message:', parsedMessage);

//     setMessages((prev) => [
//       ...prev,
//       {
//         id: parsedMessage.messageId || Date.now().toString(),
//         content: parsedMessage.content,
//         senderName: type === 'SYSTEM' ? 'SYSTEM' : parsedMessage.nickname || parsedMessage.sender,
//         timestamp: parsedMessage.sendTime || parsedMessage.timestamp || new Date().toISOString(),
//         type,
//       } as ChatMessage,
//     ]);
//   };

//   // useEffect(() => {
//   //   if (!participants) return;

//   //   console.log(participants);

//   //   const playersList: Player[] = [];

//   //   // participant 객체에 있는 플레이어만 표시
//   //   Object.entries(participants).forEach(([id, p]) => {
//   //     const playerId = Number(id);
//   //     if (p && p.nickname) {
//   //       playersList.push({
//   //         id: playerId,
//   //         nickname: p.nickname,
//   //         isHost: p.participantNo === 1, // participantNo로 호스트 판단
//   //         isReady: p.ready || false,
//   //         participantNo: p.participantNo,
//   //       });
//   //     }
//   //   });

//   //   setPlayers(playersList);
//   // }, [participants]);
//   useEffect(() => {
//     if (!participants) return;

//     console.log('----------------');
//     console.log('participants 업데이트:', participants);
//     console.log('currentPlayerId:', currentPlayerId);
//     console.log('현재 isHost 상태:', isHost);

//     const playersList: Player[] = [];

//     // 현재 플레이어의 participantNo를 찾음
//     let currentParticipant;
//     Object.entries(participants).forEach(([_, p]) => {
//       if (p.memberId === currentPlayerId) {
//         currentParticipant = p;
//       }
//     });

//     // participantNo가 처음 설정될 때만 isHost 상태를 설정
//     if (currentParticipant && participantNo === null) {
//       setParticipantNo((currentParticipant as Participant).participantNo);
//       setIsHost((currentParticipant as Participant).participantNo === 1);
//     }

//     // 플레이어 리스트 업데이트
//     Object.entries(participants).forEach(([id, p]) => {
//       const playerId = Number(id);
//       if (p && p.nickname) {
//         playersList.push({
//           id: playerId,
//           nickname: p.nickname,
//           isHost: p.participantNo === 1,
//           isReady: p.ready || false,
//           participantNo: p.participantNo,
//         });
//       }
//     });

//     console.log('생성된 playersList:', playersList);
//     setPlayers(playersList);
//   }, [participants, currentPlayerId]);

//   useEffect(() => {
//     if (!stompClientRef.current) return;

//     if (gameState?.roomStatus === 'PLAYING' && gameState.participant[currentPlayerId]) {
//       const playerSubscriptions = gameState.participant[currentPlayerId].subscriptions || [];

//       playerSubscriptions.forEach((subscription) => {
//         if (subscription.includes('day')) {
//           stompClientRef.current.subscribe(
//             `/topic/game-${roomId}-day-chat`,
//             (msg: { body: string }) => handleMessage('DAY', msg.body),
//           );
//           setCurrentChatType('DAY');
//         }
//         if (subscription.includes('night')) {
//           stompClientRef.current.subscribe(
//             `/topic/game-${roomId}-night-chat`,
//             (msg: { body: string }) => handleMessage('NIGHT', msg.body),
//           );
//           setCurrentChatType('NIGHT');
//         }
//         if (subscription.includes('dead')) {
//           stompClientRef.current.subscribe(
//             `/topic/game-${roomId}-dead-chat`,
//             (msg: { body: string }) => handleMessage('DEAD', msg.body),
//           );
//           setCurrentChatType('DEAD');
//         }
//         if (subscription.includes('system')) {
//           stompClientRef.current.subscribe(
//             `/topic/game-${roomId}-system`,
//             (msg: { body: string }) => handleMessage('SYSTEM', msg.body),
//           );
//         }
//       });
//     }
//   }, [roomId, gameState?.roomStatus, currentPlayerId]);

//   useEffect(() => {
//     console.log('실험----------------');
//     console.log('GameRoom - isHost 상태:', isHost);
//     console.log('GameRoom - players:', players);
//   }, [isHost, players]);

//   useEffect(() => {
//     let roomSubscription: any = null;
//     let chatSubscription: any = null;

//     const initializeRoom = async () => {
//       try {
//         if (!roomId) return;

//         await roomApi.initializeWebSocket();
//         const stompClient = roomApi.getStompClient();
//         stompClientRef.current = stompClient;

//         const responseNickname = await axios.get('/api/member');
//         const { nickname } = responseNickname.data.result;

//         if (stompClient) {
//           // 방 상태 업데이트 구독
//           roomSubscription = roomApi.subscribeRoom(Number(roomId), (participantsInfo) => {
//             console.log(participantNo);

//             // 방에서 방장이 있는지 확인 후 없으면 로비로 이동
//             let isHostLeft = true;
//             Object.values(participantsInfo).forEach((participantInfo) => {
//               if (participantInfo.participantNo === 1) {
//                 isHostLeft = false;
//               }
//             });

//             if (isHostLeft) return navigate('/game-lobby');

//             // 새로운 참가자 목록에서 내 닉네임으로 정보 찾기
//             // 중복된 닉네임일시 둘다 퇴장될 가능성 100% 추후 수정 필요
//             const myNewInfo = Object.values(participantsInfo).find((p) => {
//               console.log(nickname);
//               console.log(`p: ${p.nickname}`);
//               return p.nickname === nickname;
//             });

//             if (!myNewInfo) {
//               alert(`${!myNewInfo} 강제 퇴장 당하였습니다.`);
//               navigate('/game-lobby');
//             }

//             // 방이 없어졌거나 참가자 목록이 비어있으면 로비로 이동
//             if (!participantsInfo) {
//               alert('방이 삭제되었습니다.');
//               navigate('/game-lobby');
//               return;
//             }
//             // setGameState(roomInfo);
//             setParticipants(participantsInfo);
//           });

//           // 채팅 구독
//           chatSubscription = stompClient.subscribe(
//             `/topic/room-${roomId}-chat`,
//             (msg: { body: string }) => handleMessage('ROOM', msg.body),
//           );

//           await roomApi.joinRoom(Number(roomId));
//         }

//         const response = await roomApi.getRoom(Number(roomId));
//         if (response.data.isSuccess) {
//           const room = response.data.result;
//           if (room) {
//             setGameState(room);
//             const chatResponse = await axios.get(`/chat?gameId=${roomId}&chatType=ROOM&count=50`);
//             if (chatResponse.data.isSuccess) {
//               setMessages(chatResponse.data.result);
//             }
//           } else {
//             navigate('/game-lobby');
//           }
//         }
//       } catch (error) {
//         console.error('Failed to initialize room:', error);
//         navigate('/game-lobby');
//       }
//     };

//     initializeRoom();

//     // cleanup function은 async 함수 밖에서 반환
//     return () => {
//       if (roomSubscription) roomSubscription.unsubscribe();
//       if (chatSubscription) chatSubscription.unsubscribe();
//       window.sessionStorage.removeItem(`room-${roomId}-entered`);
//       roomApi.disconnect();
//     };
//   }, [roomId, navigate]);

//   const handleLeaveRoom = async () => {
//     try {
//       if (!roomId || participantNo == null) return;
//       const response = await roomApi.leaveRoom(Number(roomId));
//       if (response.data.isSuccess) {
//         // 호스트였다면 추가 처리 필요 없음 (다른 참가자들은 방 상태 구독을 통해 자동으로 나가짐)
//         navigate('/game-lobby');
//       }
//     } catch (error) {
//       console.error('Failed to leave room:', error);
//       // 에러가 나도 로비로 이동
//       navigate('/game-lobby');
//     }
//   };

//   const handleReadyState = async () => {
//     try {
//       if (!roomId || participantNo == null) return;
//       const response = await roomApi.readyRoom(Number(roomId));
//       if (response.data.isSuccess) {
//         setPlayers((prevPlayers) =>
//           prevPlayers.map((player) =>
//             player.id === currentPlayerId ? { ...player, isReady: !player.isReady } : player,
//           ),
//         );
//       }
//     } catch (error) {
//       console.error('Failed to change ready state:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 404) {
//         alert('플레이어를 찾을 수 없습니다.');
//       }
//     }
//   };

//   const handleGameStart = async () => {
//     try {
//       if (!roomId || participantNo == null) return;

//       // 호스트를 제외한 모든 플레이어의 준비 상태 확인
//       const nonHostPlayers = players.filter((p) => !p.isHost);
//       const allPlayersReady = nonHostPlayers.every((p) => p.isReady);

//       if (!allPlayersReady) {
//         alert('모든 참가자가 준비를 완료해야 합니다.');
//         return;
//       }

//       const response = await roomApi.startGame(Number(roomId));
//       if (response.data.isSuccess) {
//         const gameStartData = response.data.result as GameStartResponse;
//         setGameState((prevState) => ({
//           ...prevState!,
//           roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
//           participant: gameStartData.participant,
//         }));
//       }
//     } catch (error) {
//       console.error('Failed to start game:', error);
//       if (error instanceof Error) {
//         alert(error.message);
//       } else {
//         alert('게임 시작에 실패했습니다.');
//       }
//     }
//   };

//   const handleSendMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newMessage.trim() || !roomId || !stompClientRef.current) return;

//     stompClientRef.current.send(
//       '/app/chat/send',
//       {},
//       JSON.stringify({
//         gameId: roomId,
//         content: newMessage,
//         chatType: currentChatType,
//       }),
//     );

//     setNewMessage('');
//   };

//   return (
//     <div
//       className="h-screen bg-cover bg-center bg-fixed"
//       style={{ backgroundImage: 'url("/images/splash_background.jpg")' }}
//     >
//       <div className="absolute inset-0 bg-black bg-opacity-70" />

//       <div className="relative h-full z-10 p-4">
//         <GameHeader
//           roomId={roomId || ''}
//           gameState={gameState}
//           onLeave={handleLeaveRoom}
//           // onReady={handleReadyState}
//           // onStart={handleGameStart}
//           // isHost={isHost}
//         />

//         <div className="flex h-full gap-4 pt-16">
//           <div className="flex-1">
//             {!gameState?.roomStatus ? (
//               <WaitingRoom
//                 players={players}
//                 isHost={isHost}
//                 requiredPlayers={requiredPlayers}
//                 onReady={handleReadyState}
//                 onStart={handleGameStart}
//                 roomId={Number(roomId)}
//               />
//             ) : (
//               <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
//                 <GameStatus gameState={gameState} />
//               </div>
//             )}
//           </div>
//           <ChatWindow
//             messages={messages}
//             newMessage={newMessage}
//             onMessageChange={setNewMessage}
//             onSendMessage={handleSendMessage}
//             chatType={currentChatType}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default GameRoom;
