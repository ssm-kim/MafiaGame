// 넘버로 바꾼거

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomApi from '@/api/roomApi';
import { Room, GameStartResponse } from '@/types/room';
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
  const [requiredPlayers] = useState<number>(8);
  const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');
  const stompClientRef = useRef<any>(null);

  useEffect(() => {
    const fetchMemberId = async () => {
      try {
        const response = await axios.get('/api/member');
        if (response.data.isSuccess) {
          const myId = response.data.result.memberId;
          setCurrentPlayerId(myId);
          console.log('API에서 가져온 memberId:', myId);
        }
      } catch (error) {
        console.error('Failed to fetch member ID:', error);
      }
    };
    fetchMemberId();
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
    if (gameState) {
      const { participant } = gameState;
      const playersList: Player[] = [];

      // participant 객체에 있는 플레이어만 표시
      Object.entries(participant).forEach(([id, p]) => {
        const playerId = Number(id);
        if (p && p.nickName) {
          playersList.push({
            id: playerId,
            nickname: p.nickName,
            isHost: p.participantNo === 1, // participantNo로 호스트 판단
            isReady: p.ready || false,
            participantNo: p.participantNo,
          });
        }
      });

      setPlayers(playersList);

      // 현재 플레이어가 호스트인지 확인
      const currentPlayer = playersList.find((p) => p.id === currentPlayerId);
      setIsHost(currentPlayer?.participantNo === 1);
    }
  }, [gameState, currentPlayerId]);

  useEffect(() => {
    if (!stompClientRef.current) return;

    if (gameState?.roomStatus === 'PLAYING' && gameState.participant[currentPlayerId]) {
      const playerSubscriptions = gameState.participant[currentPlayerId].subscriptions || [];

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
  }, [roomId, gameState?.roomStatus, currentPlayerId]);

  // useEffect(() => {
  //   const initializeRoom = async () => {
  //     try {
  //       if (!roomId) return;

  //       await roomApi.initializeWebSocket();
  //       const stompClient = roomApi.getStompClient();
  //       stompClientRef.current = stompClient;

  //       if (stompClient) {
  //         roomApi.subscribeRoom(Number(roomId), (roomInfo) => {
  //           setGameState(roomInfo);
  //         });

  //         stompClient.subscribe(`/topic/room-${roomId}-chat`, (msg: { body: string }) =>
  //           handleMessage('ROOM', msg.body),
  //         );
  //       }

  //       const response = await roomApi.getRoom(Number(roomId));
  //       if (response.data.isSuccess) {
  //         const room = response.data.result;
  //         if (room) {
  //           setGameState(room);

  //           // 이전 채팅 기록 가져오기
  //           const chatResponse = await axios.get(`/chat?gameId=${roomId}&chatType=ROOM&count=50`);
  //           if (chatResponse.data.isSuccess) {
  //             setMessages(chatResponse.data.result);
  //           }
  //         } else {
  //           navigate('/game-lobby');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to initialize room:', error);
  //     }
  //   };

  //   initializeRoom();

  //   return () => {
  //     roomApi.disconnect();
  //   };
  // }, [roomId, navigate]);

  const [participantNo, setParticipantNo] = useState<number | null>(null);

  useEffect(() => {
    let roomSubscription: any = null;
    let chatSubscription: any = null;

    const initializeRoom = async () => {
      try {
        if (!roomId) return;

        await roomApi.initializeWebSocket();
        const stompClient = roomApi.getStompClient();
        stompClientRef.current = stompClient;

        if (stompClient) {
          // 방 상태 업데이트 구독
          roomSubscription = roomApi.subscribeRoom(Number(roomId), (roomInfo) => {
            if (!participantNo) {
              setParticipantNo(roomInfo.initParticipantNo);
            }

            // 방이 없어졌거나 참가자 목록이 비어있으면 로비로 이동
            if (!roomInfo) {
              alert('방이 삭제되었습니다.');
              navigate('/game-lobby');
              return;
            }
            setGameState(roomInfo);
          });

          // 채팅 구독
          chatSubscription = stompClient.subscribe(
            `/topic/room-${roomId}-chat`,
            (msg: { body: string }) => handleMessage('ROOM', msg.body),
          );
        }

        const response = await roomApi.getRoom(Number(roomId));
        if (response.data.isSuccess) {
          const room = response.data.result;
          if (room) {
            setGameState(room);
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

    // cleanup function은 async 함수 밖에서 반환
    return () => {
      if (roomSubscription) roomSubscription.unsubscribe();
      if (chatSubscription) chatSubscription.unsubscribe();
      roomApi.disconnect();
    };
  }, [roomId, navigate]);

  // const handleLeaveRoom = async () => {
  //   try {
  //     if (!roomId) return;
  //     const response = await roomApi.leaveRoom(Number(roomId));
  //     if (response.data.isSuccess) {
  //       navigate('/game-lobby');
  //     }
  //   } catch (error) {
  //     console.error('Failed to leave room:', error);
  //   }
  // };
  const handleLeaveRoom = async () => {
    try {
      if (!roomId || participantNo == null) return;
      const response = await roomApi.leaveRoom(Number(roomId), participantNo);
      if (response.data.isSuccess) {
        // 호스트였다면 추가 처리 필요 없음 (다른 참가자들은 방 상태 구독을 통해 자동으로 나가짐)
        navigate('/game-lobby');
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
      // 에러가 나도 로비로 이동
      navigate('/game-lobby');
    }
  };

  const handleReadyState = async () => {
    try {
      if (!roomId || participantNo == null) return;
      const response = await roomApi.readyRoom(Number(roomId), participantNo);
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
      if (!roomId || participantNo == null) return;

      // 호스트를 제외한 모든 플레이어의 준비 상태 확인
      const nonHostPlayers = players.filter((p) => !p.isHost);
      const allPlayersReady = nonHostPlayers.every((p) => p.isReady);

      if (!allPlayersReady) {
        alert('모든 참가자가 준비를 완료해야 합니다.');
        return;
      }

      const response = await roomApi.startGame(Number(roomId), participantNo);
      if (response.data.isSuccess) {
        const gameStartData = response.data.result as GameStartResponse;
        setGameState((prevState) => ({
          ...prevState!,
          roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
          participant: gameStartData.participant,
        }));
      }
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
          onReady={handleReadyState}
          onStart={handleGameStart}
          isHost={isHost}
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
// import { Room, GameStartResponse } from '@/types/room';
// import { ChatMessage } from '@/types/chat';
// import GameHeader from '@/components/gameroom/GameHeader';
// import GameStatus from '@/components/gameroom/GameStatus';
// import ChatWindow from '@/components/gameroom/ChatWindow';
// import WaitingRoom from '@/components/gameroom/WaitingRoom';
// import { Player } from '../../types/player';

// export interface Participant {
//   memberId: number;
//   nickName: string;
//   ready: boolean;
//   subscriptions?: string[];
//   isDead?: boolean;
// }

// function GameRoom(): JSX.Element {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [gameState, setGameState] = useState<Room | null>(null);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [isHost, setIsHost] = useState(false);
//   const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
//   const [requiredPlayers] = useState<number>(8);
//   const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');
//   const stompClientRef = useRef<any>(null);

//   useEffect(() => {
//     const fetchMemberId = async () => {
//       try {
//         const response = await axios.get('/api/member');
//         if (response.data.isSuccess) {
//           const myId = response.data.result.id;
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

//   // const findCurrentParticipant = (participant: Record<string, Participant>, nickname: string) => {
//   //   const entry = Object.entries(participant).find(([_, p]) => p.nickName === nickname);
//   //   return entry ? { ...entry[1], memberId: Number(entry[0]) } : null;
//   // };

//   // useEffect(() => {
//   //   if (gameState) {
//   //     const { hostId, participant } = gameState;
//   //     const playersList: Player[] = [];

//   //     // 현재 닉네임 가져오기
//   //     const currentNickname = localStorage.getItem('username');
//   //     const currentParticipant = currentNickname
//   //       ? findCurrentParticipant(participant, currentNickname)
//   //       : null;

//   //     if (currentParticipant) {
//   //       setCurrentPlayerId(currentParticipant.memberId);
//   //     }

//   //     console.log('=== 참가자 정보 ===');
//   //     console.log('현재 게임 상태:', gameState);
//   //     console.log('참가자 목록:', participant);
//   //     console.log('현재 사용자:', currentParticipant?.memberId);
//   //     console.log('호스트:', hostId);

//   //     // participant 객체의 각 엔트리를 순회
//   //     Object.entries(participant).forEach(([id, p]) => {
//   //       const playerId = Number(id);
//   //       playersList.push({
//   //         id: playerId,
//   //         hostId,
//   //         nickname: p.nickName,
//   //         isHost: playerId === hostId,
//   //         isReady: p.ready || false,
//   //       });
//   //     });

//   //     setPlayers(playersList);
//   //     setIsHost(currentParticipant?.memberId === hostId);
//   //   }
//   // }, [gameState]);
//   useEffect(() => {
//     if (gameState) {
//       const { hostId, participant } = gameState;
//       const playersList: Player[] = [];

//       // participant 객체에 있는 플레이어만 표시
//       Object.entries(participant).forEach(([id, p]) => {
//         const playerId = Number(id);
//         // 실제 participant에 있는 플레이어만 추가
//         if (p && p.nickName) {
//           playersList.push({
//             id: playerId,
//             // hostId,
//             nickname: p.nickName,
//             isHost: number === 1,
//             isReady: p.ready || false,
//             participantNo: number,
//           });
//         }
//       });

//       setPlayers(playersList);

//       // 현재 플레이어가 호스트인지 확인
//       // const currentUserIsHost = currentPlayerId === hostId;
//       setIsHost(currentPlayerId === 1);
//     }
//   }, [gameState, currentPlayerId]);

//   useEffect(() => {
//     const initializeRoom = async () => {
//       try {
//         if (!roomId) return;

//         await roomApi.initializeWebSocket();
//         const stompClient = roomApi.getStompClient();
//         stompClientRef.current = stompClient;

//         if (stompClient) {
//           roomApi.subscribeRoom(Number(roomId), (roomInfo) => {
//             setGameState(roomInfo);
//           });

//           stompClient.subscribe(`/topic/room-${roomId}-chat`, (msg: { body: string }) =>
//             handleMessage('ROOM', msg.body),
//           );
//         }

//         const response = await roomApi.getRoom(Number(roomId));
//         if (response.data.isSuccess) {
//           const room = response.data.result;
//           if (room) {
//             setGameState(room);

//             // 이전 채팅 기록 가져오기
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
//       }
//     };

//     initializeRoom();

//     return () => {
//       roomApi.disconnect();
//     };
//   }, [roomId, navigate]);

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

//   const handleLeaveRoom = async () => {
//     try {
//       if (!roomId) return;
//       const response = await roomApi.leaveRoom(Number(roomId));
//       if (response.data.isSuccess) {
//         navigate('/game-lobby');
//       }
//     } catch (error) {
//       console.error('Failed to leave room:', error);
//     }
//   };

//   const handleReadyState = async () => {
//     try {
//       if (!roomId) return;
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
//       if (!roomId) return;
//       const response = await roomApi.startGame(Number(roomId));
//       if (response.data.isSuccess) {
//         const gameStartData = response.data.result as GameStartResponse;
//         const convertedGameState: Room = {
//           roomId: gameStartData.roomId,
//           roomTitle: gameState?.roomTitle || '',
//           roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
//           roomOption: gameState?.roomOption || '',
//           maxPlayer: gameState?.maxPlayer || 8,
//           isVoice: gameState?.isVoice || false,
//           createdAt: gameState?.createdAt || new Date().toISOString(),
//           peopleCnt: Object.keys(gameStartData.participant).length,
//           hostId: gameStartData.hostId,
//           participant: gameStartData.participant,
//         };
//         setGameState(convertedGameState);
//       }
//     } catch (error) {
//       console.error('Failed to start game:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('모든 참가자가 준비를 완료하지 않았습니다.');
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
//           onReady={handleReadyState}
//           onStart={handleGameStart}
//           isHost={isHost}
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
// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// // import { Stomp } from '@stomp/stompjs';
// import roomApi from '@/api/roomApi';
// import { Room, GameStartResponse } from '@/types/room';
// import { ChatMessage } from '@/types/chat';
// import GameHeader from '@/components/gameroom/GameHeader';
// import GameStatus from '@/components/gameroom/GameStatus';
// import ChatWindow from '@/components/gameroom/ChatWindow';
// import WaitingRoom from '@/components/gameroom/WaitingRoom';
// import { Player } from '../../types/player';

// export interface Participant {
//   memberId: number;
//   nickName: string;
//   ready: boolean;
//   subscriptions?: string[];
//   isDead?: boolean;
// }

// // function GameRoom(): JSX.Element {
// //   const { roomId } = useParams();
// //   const navigate = useNavigate();
// //   const [messages, setMessages] = useState<ChatMessage[]>([]);
// //   const [newMessage, setNewMessage] = useState('');
// //   const [gameState, setGameState] = useState<Room | null>(null);
// //   const [players, setPlayers] = useState<Player[]>([]);
// //   const [isHost, setIsHost] = useState(false);
// //   const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
// //   const [requiredPlayers] = useState<number>(8);
// //   const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');
// //   const stompClientRef = useRef<any>(null);

// //   useEffect(() => {
// //     setCurrentPlayerId(Number(localStorage.getItem('memberId')));
// //   }, []);

// //   const handleMessage = (type: string, message: string) => {
// //     console.log('Message type:', type);
// //     console.log('Raw message:', message);
// //     const parsedMessage = JSON.parse(message);
// //     console.log('Parsed message:', parsedMessage);

// //     setMessages((prev) => [
// //       ...prev,
// //       {
// //         id: parsedMessage.messageId || Date.now().toString(),
// //         content: parsedMessage.content,
// //         senderName: type === 'SYSTEM' ? 'SYSTEM' : parsedMessage.nickname || parsedMessage.sender,
// //         timestamp: parsedMessage.sendTime || parsedMessage.timestamp || new Date().toISOString(),
// //         type,
// //       } as ChatMessage,
// //     ]);
// //   };

// //   useEffect(() => {
// //     if (gameState) {
// //       const currentUserId = Number(localStorage.getItem('memberId'));
// //       const { hostId, participant } = gameState;
// //       const playersList: Player[] = [];
// //       console.log('=== 참가자 정보 ===');
// //       console.log('현재 게임 상태:', gameState);
// //       console.log('참가자 목록:', participant);
// //       console.log('현재 사용자:', currentUserId);
// //       console.log('호스트:', hostId);
// //       if (hostId) {
// //         const hostNickname =
// //           participant[hostId]?.nickName ||
// //           localStorage.getItem('username') ||
// //           `테스트유저${hostId}`;
// //         playersList.push({
// //           id: hostId,
// //           hostId,
// //           nickname: hostNickname,
// //           isHost: true,
// //           isReady: false,
// //         });
// //       }

// //       if (currentUserId !== hostId && participant[currentUserId]) {
// //         playersList.push({
// //           id: currentUserId,
// //           hostId,
// //           nickname: participant[currentUserId].nickName,
// //           isHost: false,
// //           isReady: participant[currentUserId].ready || false,
// //         });
// //       }

// //       if (participant) {
// //         Object.entries(participant).forEach(([_, p]) => {
// //           if (p.memberId !== hostId && p.memberId !== currentUserId) {
// //             playersList.push({
// //               id: p.memberId,
// //               hostId,
// //               nickname: p.nickName,
// //               isHost: false,
// //               isReady: p.ready || false,
// //             });
// //           }
// //         });
// //       }
// //       setPlayers(playersList);
// //       setIsHost(hostId === currentUserId);
// //     }
// //   }, [gameState, currentPlayerId]);

// //   // useEffect(() => {
// //   //   const initializeRoom = async () => {
// //   //     try {
// //   //       if (!roomId) return;

// //   //       await roomApi.initializeWebSocket();
// //   //       const stompClient = roomApi.getStompClient();
// //   //       stompClientRef.current = stompClient;

// //   //       if (stompClient) {
// //   //         roomApi.subscribeRoom(Number(roomId), (roomInfo) => {
// //   //           setGameState(roomInfo);
// //   //         });

// //   //         stompClient.subscribe(`/topic/room-${roomId}-chat`, (msg: { body: string }) =>
// //   //           handleMessage('ROOM', msg.body),
// //   //         );
// //   //       }

// //   //       const response = await roomApi.getRoom(Number(roomId));
// //   //       if (response.data.isSuccess) {
// //   //         const room = response.data.result;
// //   //         if (room) {
// //   //           setGameState(room);
// //   //         } else {
// //   //           navigate('/game-lobby');
// //   //         }
// //   //       }
// //   //     } catch (error) {
// //   //       console.error('Failed to initialize room:', error);
// //   //     }
// //   //   };

// //   //   initializeRoom();

// //   //   return () => {
// //   //     roomApi.disconnect();
// //   //   };
// //   // }, [roomId, navigate]);
// //   useEffect(() => {
// //     const initializeRoom = async () => {
// //       try {
// //         if (!roomId) return;

// //         await roomApi.initializeWebSocket();
// //         const stompClient = roomApi.getStompClient();
// //         stompClientRef.current = stompClient;

// //         if (stompClient) {
// //           roomApi.subscribeRoom(Number(roomId), (roomInfo) => {
// //             setGameState(roomInfo);
// //           });

// //           stompClient.subscribe(`/topic/room-${roomId}-chat`, (msg: { body: string }) =>
// //             handleMessage('ROOM', msg.body),
// //           );
// //         }

// //         const response = await roomApi.getRoom(Number(roomId));
// //         if (response.data.isSuccess) {
// //           const room = response.data.result;
// //           if (room) {
// //             setGameState(room);

// //             // 이전 채팅 기록 가져오기 //새로고침해도 그대로인지 테스트 필요
// //             const chatResponse = await axios.get(`/chat?gameId=${roomId}&chatType=ROOM&count=50`);
// //             if (chatResponse.data.isSuccess) {
// //               setMessages(chatResponse.data.result);
// //             }
// //           } else {
// //             navigate('/game-lobby');
// //           }
// //         }
// //       } catch (error) {
// //         console.error('Failed to initialize room:', error);
// //       }
// //     };

// //     initializeRoom();

// //     return () => {
// //       roomApi.disconnect();
// //     };
// //   }, [roomId, navigate]);

// //   useEffect(() => {
// //     if (!stompClientRef.current) return;

// //     if (gameState?.roomStatus === 'PLAYING' && gameState.participant[currentPlayerId]) {
// //       const playerSubscriptions = gameState.participant[currentPlayerId].subscriptions || [];

// //       playerSubscriptions.forEach((subscription) => {
// //         if (subscription.includes('day')) {
// //           stompClientRef.current.subscribe(
// //             `/topic/game-${roomId}-day-chat`,
// //             (msg: { body: string }) => handleMessage('DAY', msg.body),
// //           );
// //           setCurrentChatType('DAY');
// //         }
// //         if (subscription.includes('night')) {
// //           stompClientRef.current.subscribe(
// //             `/topic/game-${roomId}-night-chat`,
// //             (msg: { body: string }) => handleMessage('NIGHT', msg.body),
// //           );
// //           setCurrentChatType('NIGHT');
// //         }
// //         if (subscription.includes('dead')) {
// //           stompClientRef.current.subscribe(
// //             `/topic/game-${roomId}-dead-chat`,
// //             (msg: { body: string }) => handleMessage('DEAD', msg.body),
// //           );
// //           setCurrentChatType('DEAD');
// //         }
// //         if (subscription.includes('system')) {
// //           stompClientRef.current.subscribe(
// //             `/topic/game-${roomId}-system`,
// //             (msg: { body: string }) => handleMessage('SYSTEM', msg.body),
// //           );
// //         }
// //       });
// //     }
// //   }, [roomId, gameState?.roomStatus, currentPlayerId]);

// //   const handleLeaveRoom = async () => {
// //     try {
// //       if (!roomId) return;
// //       const response = await roomApi.leaveRoom(Number(roomId));
// //       if (response.data.isSuccess) {
// //         navigate('/game-lobby');
// //       }
// //     } catch (error) {
// //       console.error('Failed to leave room:', error);
// //     }
// //   };

// //   const handleReadyState = async () => {
// //     try {
// //       if (!roomId) return;
// //       const response = await roomApi.readyRoom(Number(roomId));
// //       if (response.data.isSuccess) {
// //         setPlayers((prevPlayers) =>
// //           prevPlayers.map((player) =>
// //             player.id === currentPlayerId ? { ...player, isReady: !player.isReady } : player,
// //           ),
// //         );
// //       }
// //     } catch (error) {
// //       console.error('Failed to change ready state:', error);
// //       if (axios.isAxiosError(error) && error.response?.status === 404) {
// //         alert('플레이어를 찾을 수 없습니다.');
// //       }
// //     }
// //   };

// //   const handleGameStart = async () => {
// //     try {
// //       if (!roomId) return;
// //       const response = await roomApi.startGame(Number(roomId));
// //       if (response.data.isSuccess) {
// //         const gameStartData = response.data.result as GameStartResponse;
// //         const convertedGameState: Room = {
// //           roomId: gameStartData.roomId,
// //           roomTitle: gameState?.roomTitle || '',
// //           roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
// //           roomOption: gameState?.roomOption || '',
// //           maxPlayer: gameState?.maxPlayer || 8,
// //           isVoice: gameState?.isVoice || false,
// //           createdAt: gameState?.createdAt || new Date().toISOString(),
// //           peopleCnt: Object.keys(gameStartData.participant).length,
// //           hostId: gameStartData.hostId,
// //           participant: gameStartData.participant,
// //         };
// //         setGameState(convertedGameState);
// //       }
// //     } catch (error) {
// //       console.error('Failed to start game:', error);
// //       if (axios.isAxiosError(error) && error.response?.status === 400) {
// //         alert('모든 참가자가 준비를 완료하지 않았습니다.');
// //       }
// //     }
// //   };

// //   const handleSendMessage = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!newMessage.trim() || !roomId || !stompClientRef.current) return;

// //     stompClientRef.current.send(
// //       '/app/chat/send',
// //       {},
// //       JSON.stringify({
// //         gameId: roomId,
// //         content: newMessage,
// //         chatType: currentChatType,
// //       }),
// //     );

// //     setNewMessage('');
// //   };
// function GameRoom(): JSX.Element {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [gameState, setGameState] = useState<Room | null>(null);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [isHost, setIsHost] = useState(false);
//   const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
//   const [requiredPlayers] = useState<number>(8);
//   const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');
//   const stompClientRef = useRef<any>(null);

//   useEffect(() => {
//     const fetchMemberId = async () => {
//       try {
//         const response = await axios.get('/api/member');
//         if (response.data.isSuccess) {
//           const myId = response.data.result.id;
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
//   const findCurrentParticipant = (participant: Record<string, Participant>, nickname: string) => {
//     const entry = Object.entries(participant).find(([_, p]) => p.nickName === nickname);
//     return entry ? { memberId: Number(entry[0]), ...entry[1] } : null;
//   };

//   // useEffect(() => {
//   //   if (gameState) {
//   //     const { hostId, participant } = gameState;
//   //     const playersList: Player[] = [];

//   //     console.log('=== 참가자 정보 ===');
//   //     console.log('현재 게임 상태:', gameState);
//   //     console.log('참가자 목록:', participant);
//   //     console.log('현재 사용자:', currentPlayerId);
//   //     console.log('호스트:', hostId);

//   //     // participant 객체의 각 엔트리를 순회
//   //     Object.entries(participant).forEach(([id, p]) => {
//   //       const playerId = Number(id);
//   //       playersList.push({
//   //         id: playerId,
//   //         hostId,
//   //         nickname: p.nickName,
//   //         isHost: playerId === hostId,
//   //         isReady: p.ready || false,
//   //       });
//   //     });

//   //     setPlayers(playersList);
//   //     setIsHost(currentPlayerId === hostId);
//   //   }
//   // }, [gameState, currentPlayerId]);

//   useEffect(() => {
//     if (gameState) {
//       const { hostId, participant } = gameState;
//       const playersList: Player[] = [];

//       // 현재 닉네임 가져오기
//       const currentNickname = localStorage.getItem('username');
//       const currentParticipant = currentNickname
//         ? findCurrentParticipant(participant, currentNickname)
//         : null;

//       if (currentParticipant) {
//         setCurrentPlayerId(currentParticipant.memberId);
//       }

//       console.log('=== 참가자 정보 ===');
//       console.log('현재 게임 상태:', gameState);
//       console.log('참가자 목록:', participant);
//       console.log('현재 사용자:', currentParticipant?.memberId);
//       console.log('호스트:', hostId);

//       // participant 객체의 각 엔트리를 순회
//       Object.entries(participant).forEach(([id, p]) => {
//         const playerId = Number(id);
//         playersList.push({
//           id: playerId,
//           hostId,
//           nickname: p.nickName,
//           isHost: playerId === hostId,
//           isReady: p.ready || false,
//         });
//       });

//       setPlayers(playersList);
//       setIsHost(currentParticipant?.memberId === hostId);
//     }
//   }, [gameState]);

//   useEffect(() => {
//     const initializeRoom = async () => {
//       try {
//         if (!roomId) return;

//         await roomApi.initializeWebSocket();
//         const stompClient = roomApi.getStompClient();
//         stompClientRef.current = stompClient;

//         if (stompClient) {
//           roomApi.subscribeRoom(Number(roomId), (roomInfo) => {
//             setGameState(roomInfo);
//           });

//           stompClient.subscribe(`/topic/room-${roomId}-chat`, (msg: { body: string }) =>
//             handleMessage('ROOM', msg.body),
//           );
//         }

//         const response = await roomApi.getRoom(Number(roomId));
//         if (response.data.isSuccess) {
//           const room = response.data.result;
//           if (room) {
//             setGameState(room);

//             // 이전 채팅 기록 가져오기
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
//       }
//     };

//     initializeRoom();

//     return () => {
//       roomApi.disconnect();
//     };
//   }, [roomId, navigate]);

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

//   const handleLeaveRoom = async () => {
//     try {
//       if (!roomId) return;
//       const response = await roomApi.leaveRoom(Number(roomId));
//       if (response.data.isSuccess) {
//         navigate('/game-lobby');
//       }
//     } catch (error) {
//       console.error('Failed to leave room:', error);
//     }
//   };

//   const handleReadyState = async () => {
//     try {
//       if (!roomId) return;
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
//       if (!roomId) return;
//       const response = await roomApi.startGame(Number(roomId));
//       if (response.data.isSuccess) {
//         const gameStartData = response.data.result as GameStartResponse;
//         const convertedGameState: Room = {
//           roomId: gameStartData.roomId,
//           roomTitle: gameState?.roomTitle || '',
//           roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
//           roomOption: gameState?.roomOption || '',
//           maxPlayer: gameState?.maxPlayer || 8,
//           isVoice: gameState?.isVoice || false,
//           createdAt: gameState?.createdAt || new Date().toISOString(),
//           peopleCnt: Object.keys(gameStartData.participant).length,
//           hostId: gameStartData.hostId,
//           participant: gameStartData.participant,
//         };
//         setGameState(convertedGameState);
//       }
//     } catch (error) {
//       console.error('Failed to start game:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('모든 참가자가 준비를 완료하지 않았습니다.');
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
//           onReady={handleReadyState}
//           onStart={handleGameStart}
//           isHost={isHost}
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
// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { Stomp } from '@stomp/stompjs';
// // import { connectWebSocket, sendChatMessage } from '@/api/WebSocket';
// import roomApi from '@/api/roomApi';
// import { Room, GameStartResponse } from '@/types/room';
// import { ChatMessage } from '@/types/chat';
// import GameHeader from '@/components/gameroom/GameHeader';
// import GameStatus from '@/components/gameroom/GameStatus';
// import ChatWindow from '@/components/gameroom/ChatWindow';
// import WaitingRoom from '@/components/gameroom/WaitingRoom';
// import { Player } from '../../types/player';

// function GameRoom(): JSX.Element {
//   // 기본 상태 관리
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [gameState, setGameState] = useState<Room | null>(null);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [isHost, setIsHost] = useState(false);
//   const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
//   const [requiredPlayers] = useState<number>(8);
//   const [currentChatType, setCurrentChatType] = useState<'ROOM' | 'DAY' | 'NIGHT' | 'DEAD'>('ROOM');

//   // 웹소켓 클라이언트 참조 관리
//   const stompClientRef = useRef<any>(null);

//   // 초기 로딩 시 현재 플레이어 ID 설정
//   useEffect(() => {
//     setCurrentPlayerId(Number(localStorage.getItem('memberId')));
//   }, []);

//   // 웹소켓 메시지 핸들러
//   // const handleMessage = (type: string, message: string) => {
//   //   console.log(type);
//   //   const parsedMessage = JSON.parse(message);
//   //   setMessages((prev) => [
//   //     ...prev,
//   //     {
//   //       id: parsedMessage.messageId,
//   //       content: parsedMessage.content,
//   //       senderName: type === 'SYSTEM' ? 'SYSTEM' : parsedMessage.sender,
//   //       timestamp: parsedMessage.timestamp,
//   //       type,
//   //     },
//   //   ]);
//   // };
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
//         senderName: type === 'SYSTEM' ? 'SYSTEM' : parsedMessage.nickname || parsedMessage.sender, // nickname 또는 sender 확인
//         timestamp: parsedMessage.sendTime || parsedMessage.timestamp || new Date().toISOString(), // sendTime 또는 timestamp 확인
//         type,
//       } as ChatMessage,
//     ]);
//   };

//   // 게임 상태 변경 시 플레이어 정보 업데이트
//   useEffect(() => {
//     if (gameState) {
//       const currentUserId = Number(localStorage.getItem('memberId'));
//       const { hostId, participant } = gameState;

//       const playersList: Player[] = [];

//       // 호스트 플레이어 추가
//       if (hostId) {
//         playersList.push({
//           id: hostId,
//           hostId,
//           nickname: `테스트유저${hostId}`,
//           isHost: true,
//           isReady: false,
//         });
//       }

//       // 현재 플레이어 추가 (호스트가 아닌 경우)
//       if (currentUserId !== hostId) {
//         playersList.push({
//           id: currentUserId,
//           hostId,
//           nickname: localStorage.getItem('username') || `테스트유저${currentUserId}`,
//           isHost: false,
//           isReady: participant ? participant[currentPlayerId].ready : false,
//         });
//       }

//       // 다른 참가자들 추가
//       if (participant) {
//         Object.entries(participant).forEach(([_, p]) => {
//           if (p.memberId !== hostId && p.memberId !== currentUserId) {
//             playersList.push({
//               id: p.memberId,
//               hostId,
//               nickname: p.nickName,
//               isHost: false,
//               isReady: p.ready || false,
//             });
//           }
//         });
//       }

//       setPlayers(playersList);
//       setIsHost(hostId === currentUserId);
//     }
//   }, [gameState, currentPlayerId]);

//   useEffect(() => {
//     // 웹소켓 연결 설정
//     const socket = new WebSocket('wss://i12d101.p.ssafy.io/ws-mafia');
//     const stomp = Stomp.over(socket);

//     stomp.connect({}, () => {
//       if (stompClientRef.current && roomId) {
//         // null 체크 추가
//         stompClientRef.current.subscribe(`/topic/room-${roomId}-chat`, (msg: { body: string }) =>
//           handleMessage('ROOM', msg.body),
//         );
//       }
//     });

//     stompClientRef.current = stomp;

//     // 방 정보 가져오기
//     const fetchRoomInfo = async () => {
//       try {
//         if (!roomId) return;
//         const response = await roomApi.getRoom(Number(roomId));
//         if (response.data.isSuccess) {
//           const room = response.data.result;
//           if (room) {
//             setGameState(room);
//           } else {
//             navigate('/game-lobby');
//           }
//         }
//       } catch (error) {
//         console.error('Failed to fetch room info:', error);
//       }
//     };

//     // 초기 방 정보 로드 및 주기적 업데이트 설정
//     fetchRoomInfo();
//     const interval = setInterval(fetchRoomInfo, 3000);

//     // 클린업 함수
//     return () => {
//       if (stompClientRef.current) {
//         stompClientRef.current.disconnect();
//       }
//       clearInterval(interval);
//     };
//   }, []);

//   useEffect(() => {
//     if (!stompClientRef.current) return;

//     if (gameState?.roomStatus === 'PLAYING' && gameState.participant[currentPlayerId]) {
//       const playerSubscriptions = gameState.participant[currentPlayerId].subscriptions || [];

//       // 플레이어의 구독 정보에 따라 채팅방 구독
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

//   // 방 나가기 핸들러
//   const handleLeaveRoom = async () => {
//     try {
//       if (!roomId) return;
//       const response = await roomApi.leaveRoom(Number(roomId));
//       if (response.data.isSuccess) {
//         navigate('/game-lobby');
//       }
//     } catch (error) {
//       console.error('Failed to leave room:', error);
//     }
//   };

//   // 준비 상태 토글 핸들러
//   const handleReadyState = async () => {
//     try {
//       if (!roomId) return;
//       // const memberId = Number(localStorage.getItem('memberId'));
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

//   // 게임 시작 핸들러
//   const handleGameStart = async () => {
//     try {
//       if (!roomId) return;
//       // const memberId = Number(localStorage.getItem('memberId'));
//       const response = await roomApi.startGame(Number(roomId));
//       if (response.data.isSuccess) {
//         const gameStartData = response.data.result as GameStartResponse;
//         const convertedGameState: Room = {
//           roomId: gameStartData.roomId,
//           roomTitle: gameState?.roomTitle || '',
//           // roomStatus: gameStartData.roomStatus,
//           roomStatus: gameStartData.roomStatus ? 'PLAYING' : 'WAITING',
//           roomOption: gameState?.roomOption || '',
//           maxPlayer: gameState?.maxPlayer || 8,
//           isVoice: gameState?.isVoice || false,
//           createdAt: gameState?.createdAt || new Date().toISOString(),
//           peopleCnt: Object.keys(gameStartData.participant).length,
//           hostId: gameStartData.hostId,
//           participant: gameStartData.participant,
//         };
//         setGameState(convertedGameState);
//       }
//     } catch (error) {
//       console.error('Failed to start game:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('모든 참가자가 준비를 완료하지 않았습니다.');
//       }
//     }
//   };

//   // 채팅 메시지 전송 핸들러
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

//   // const handleTestChatTypeChange = () => {
//   //   setCurrentChatType((prevType) => {
//   //     switch (prevType) {
//   //       case 'ROOM':
//   //         return 'DAY';
//   //       case 'DAY':
//   //         return 'NIGHT';
//   //       case 'NIGHT':
//   //         return 'DEAD';
//   //       case 'DEAD':
//   //         return 'ROOM';
//   //       default:
//   //         return 'ROOM';
//   //     }
//   //   });
//   // };

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
//           onReady={handleReadyState}
//           onStart={handleGameStart}
//           isHost={isHost}
//         />

//         <div className="flex h-full gap-4 pt-16">
//           <div className="flex-1">
//             {!gameState?.roomStatus ? (
//               <WaitingRoom
//                 players={players}
//                 isHost={isHost}
//                 // currentPlayerId={currentPlayerId}
//                 requiredPlayers={requiredPlayers}
//                 onReady={handleReadyState}
//                 onStart={handleGameStart}
//               />
//             ) : (
//               <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
//                 <GameStatus gameState={gameState} />
//               </div>
//             )}
//           </div>
//           {/* <button
//             type="button"
//             onClick={handleTestChatTypeChange}
//             className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded"
//           >
//             채팅 타입 변경 (현재: {currentChatType})
//           </button> */}
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
