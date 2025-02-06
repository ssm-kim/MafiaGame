// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { connectWebSocket, sendChatMessage } from '@/api/webSocket';
// import TestRoomApi from '../../api/TestRoomApi';
// import { Room } from '@/types/room';
// import { ChatMessage } from '@/types/chat';
// // import TestGameHeader from '@/components/gameroom/test/TestGameHeader';
// // import TestGameStatus from '@/components/gameroom/test/TestGameStatus';
// // import TestChatWindow from '@/components/gameroom/test/TestChatWindow';
// // import TestWaitingRoom from '@/components/gameroom/test/TestWaitingRoom';
// import TestGameHeader from '../../components/test_gameroom/TestGameHeader';
// import TestGameStatus from '../../components/test_gameroom/TestGameStatus';
// import TestChatWindow from '../../components/test_gameroom/TestChatWindow';
// import TestWaitingRoom from '../../components/test_gameroom/TestWaitingRoom';

// interface Player {
//   id: number;
//   nickname: string;
//   isHost: boolean;
//   isReady: boolean;
// }

// function TestGameRoom(): JSX.Element {
//   const { roomId } = useParams<{ roomId: string }>();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [gameState, setGameState] = useState<Room | null>(null);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [isHost, setIsHost] = useState(false);
//   const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);

//   useEffect(() => {
//     setCurrentPlayerId(Number(localStorage.getItem('memberId')));
//   }, []);

//   // useEffect(() => {
//   //   if (gameState) {
//   //     console.log('gameState:', gameState);
//   //     console.log('participant:', gameState.participant);
//   //     setIsHost(gameState.hostId === Number(localStorage.getItem('memberId')));

//   //     // participant가 비어있지 않은지 확인
//   //     if (gameState.participant && Object.keys(gameState.participant).length > 0) {
//   //       const playerList = Object.values(gameState.participant).map((p) => ({
//   //         id: p.memberId,
//   //         nickname: p.nickName,
//   //         isHost: p.memberId === gameState.hostId,
//   //         isReady: p.ready,
//   //       }));
//   //       console.log('playerList:', playerList);
//   //       setPlayers(playerList);
//   //     }
//   //   }
//   // }, [gameState]);
//   // useEffect(() => {
//   //   if (gameState) {
//   //     setIsHost(gameState.hostId === Number(localStorage.getItem('memberId')));
//   //     const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
//   //     const player = {
//   //       id: Number(userInfo.memberId),
//   //       nickname: userInfo.nickname,
//   //       isHost: gameState.hostId === Number(userInfo.memberId),
//   //       isReady: false,
//   //     };
//   //     setPlayers([player]);
//   //   }
//   // }, [gameState]);
//   // useEffect(() => {
//   //   if (gameState) {
//   //     setIsHost(gameState.hostId === Number(localStorage.getItem('memberId')));

//   //     const playersList = [];
//   //     const { hostId } = gameState;
//   //     playersList.push({
//   //       id: hostId,
//   //       nickname: `테스트유저${hostId}`,
//   //       isHost: true,
//   //       isReady: false,
//   //     });

//   //     const currentUserId = Number(localStorage.getItem('memberId'));
//   //     if (currentUserId !== hostId) {
//   //       playersList.push({
//   //         id: currentUserId,
//   //         nickname: localStorage.getItem('username'),
//   //         isHost: false,
//   //         isReady: false,
//   //       });
//   //     }

//   //     setPlayers(playersList);
//   //   }
//   // }, [gameState]);
//   // useEffect(() => {
//   //   if (gameState) {
//   //     const { hostId } = gameState;
//   //     const currentUserId = Number(localStorage.getItem('memberId'));
//   //     const currentUsername = localStorage.getItem('username');

//   //     const playersList = [
//   //       {
//   //         id: hostId,
//   //         nickname: `테스트유저${hostId}`,
//   //         isHost: true,
//   //         isReady: false,
//   //       },
//   //     ];

//   //     // 현재 유저가 호스트가 아닌 경우 추가
//   //     if (currentUserId !== hostId) {
//   //       playersList.push({
//   //         id: currentUserId,
//   //         nickname: currentUsername || `테스트유저${currentUserId}`,
//   //         isHost: false,
//   //         isReady: false,
//   //       });
//   //     }

//   //     setPlayers(playersList);
//   //     setIsHost(hostId === currentUserId);
//   //   }
//   // }, [gameState]);
//   useEffect(() => {
//     if (gameState) {
//       const currentUserId = Number(localStorage.getItem('memberId')); // 현재 사용자 ID
//       const { hostId, participant } = gameState; // 호스트 ID와 참가자 정보

//       // 플레이어 리스트 초기화
//       const playersList = [];

//       // 1. 호스트를 첫 번째로 추가
//       if (hostId) {
//         playersList.push({
//           id: hostId,
//           nickname: `테스트유저${hostId}`, // 호스트 닉네임
//           isHost: true,
//           isReady: false,
//         });
//       }

//       // 2. 현재 사용자가 호스트가 아닌 경우 추가
//       if (currentUserId !== hostId) {
//         playersList.push({
//           id: currentUserId,
//           nickname: localStorage.getItem('username') || `테스트유저${currentUserId}`, // 현재 사용자 닉네임
//           isHost: false,
//           isReady: false,
//         });
//       }

//       // 3. 나머지 참가자들 추가 (호스트와 현재 사용자 제외)
//       if (participant) {
//         Object.values(participant).forEach((p) => {
//           if (p.memberId !== hostId && p.memberId !== currentUserId) {
//             playersList.push({
//               id: p.memberId,
//               nickname: p.nickName,
//               isHost: false,
//               isReady: p.ready || false,
//             });
//           }
//         });
//       }

//       // 플레이어 리스트 상태 업데이트
//       setPlayers(playersList);
//       setIsHost(hostId === currentUserId); // 현재 사용자가 호스트인지 확인
//     }
//   }, [gameState]);

//   useEffect(() => {
//     if (!roomId) return () => {};

//     const stompClient = connectWebSocket(
//       roomId,
//       (message) => {
//         setMessages((prev) => [...prev, message]);
//       },
//       (newGameState) => {
//         console.log('newGameState:', newGameState);
//         console.log('participants:', newGameState?.participant);
//         setGameState(newGameState);
//       },
//     );

//     const fetchRoomInfo = async () => {
//       try {
//         if (!roomId) return;
//         const response = await TestRoomApi.getRoom(roomId);
//         console.log('API Full Response:', response);
//         console.log('API Response Data:', response.data);
//         console.log('API Result:', response.data.result);
//         console.log('Room response:', response.data);
//         if (response.data.isSuccess) {
//           const room = response.data.result;
//           console.log('Found Room Full Data:', room);
//           console.log('Room Participant Data:', room?.participant);
//           console.log('Found room:', room);
//           if (room) {
//             setGameState(room);
//           } else {
//             navigate('/test-lobby');
//           }
//         }
//       } catch (error) {
//         console.error('Failed to fetch room info:', error);
//       }
//     };

//     fetchRoomInfo();

//     return () => {
//       stompClient?.deactivate();
//     };
//   }, [roomId]);

//   const handleLeaveRoom = async () => {
//     try {
//       if (!roomId) return;
//       const memberId = Number(localStorage.getItem('memberId'));
//       const response = await TestRoomApi.leaveRoom(Number(roomId), memberId);

//       if (response.data.isSuccess) {
//         navigate('/test-lobby');
//       }
//     } catch (error) {
//       console.error('Failed to leave room:', error);
//       navigate('/test-lobby');
//     }
//   };

//   const handleReadyState = async () => {
//     try {
//       if (!roomId) return;
//       const memberId = Number(localStorage.getItem('memberId'));
//       const response = await TestRoomApi.readyRoom(Number(roomId), memberId);
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
//       const memberId = Number(localStorage.getItem('memberId'));
//       const response = await TestRoomApi.startGame(Number(roomId), memberId);
//       if (response.data.isSuccess) {
//         setGameState(response.data.result);
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
//     if (!newMessage.trim() || !roomId) return;

//     sendChatMessage(roomId, newMessage);
//     setMessages((prev) => [
//       ...prev,
//       {
//         id: Date.now().toString(),
//         senderName: '나',
//         content: newMessage,
//         timestamp: new Date().toISOString(),
//       },
//     ]);
//     setNewMessage('');
//   };

//   return (
//     <div
//       className="h-screen bg-cover bg-center bg-fixed"
//       style={{ backgroundImage: 'url("/images/splash_background.jpg")' }}
//     >
//       <div className="absolute inset-0 bg-black bg-opacity-70" />

//       <div className="relative h-full z-10 p-4">
//         <TestGameHeader
//           roomId={roomId || ''}
//           gameState={gameState}
//           onLeave={handleLeaveRoom}
//           onReady={handleReadyState}
//           onStart={handleGameStart}
//           isHost={isHost}
//         />

//         <div className="flex h-full gap-4 pt-16">
//           <div className="flex-1">
//             {gameState?.roomStatus ? (
//               <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
//                 <TestGameStatus gameState={gameState} />
//               </div>
//             ) : (
//               <TestWaitingRoom
//                 players={players}
//                 isHost={isHost}
//                 currentPlayerId={currentPlayerId}
//                 maxPlayers={roomData.maxPlayers}
//                 onReady={handleReadyState}
//                 onStart={handleGameStart}
//               />
//             )}
//           </div>

//           <TestChatWindow
//             messages={messages}
//             newMessage={newMessage}
//             onMessageChange={setNewMessage}
//             onSendMessage={handleSendMessage}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default TestGameRoom;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectWebSocket, sendChatMessage } from '@/api/webSocket';
import TestRoomApi from '../../api/TestRoomApi';
import { Room } from '@/types/room';
import { ChatMessage } from '@/types/chat';
import TestGameHeader from '../../components/test_gameroom/TestGameHeader';
import TestGameStatus from '../../components/test_gameroom/TestGameStatus';
import TestChatWindow from '../../components/test_gameroom/TestChatWindow';
import TestWaitingRoom from '../../components/test_gameroom/TestWaitingRoom';

interface Player {
  id: number;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
}

function TestGameRoom(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
  const [maxPlayers, setMaxPlayers] = useState<number>(8); // maxPlayers 상태 추가

  useEffect(() => {
    setCurrentPlayerId(Number(localStorage.getItem('memberId')));
  }, []);

  useEffect(() => {
    if (gameState) {
      const currentUserId = Number(localStorage.getItem('memberId'));
      const { hostId, participant } = gameState;

      const playersList = [];

      if (hostId) {
        playersList.push({
          id: hostId,
          nickname: `테스트유저${hostId}`,
          isHost: true,
          isReady: false,
        });
      }

      if (currentUserId !== hostId) {
        playersList.push({
          id: currentUserId,
          nickname: localStorage.getItem('username') || `테스트유저${currentUserId}`,
          isHost: false,
          isReady: false,
        });
      }

      if (participant) {
        Object.values(participant).forEach((p) => {
          if (p.memberId !== hostId && p.memberId !== currentUserId) {
            playersList.push({
              id: p.memberId,
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
      roomId,
      (message) => {
        setMessages((prev) => [...prev, message]);
      },
      (newGameState) => {
        console.log('newGameState:', newGameState);
        console.log('participants:', newGameState?.participant);
        setGameState(newGameState);
      },
    );

    const fetchRoomInfo = async () => {
      try {
        if (!roomId) return;
        const response = await TestRoomApi.getRoom(roomId);
        console.log('API Full Response:', response);
        console.log('API Response Data:', response.data);
        console.log('API Result:', response.data.result);
        console.log('Room response:', response.data);
        if (response.data.isSuccess) {
          const room = response.data.result;
          console.log('Found Room Full Data:', room);
          console.log('Room Participant Data:', room?.participant);
          console.log('Found room:', room);
          if (room) {
            setGameState(room);
            setMaxPlayers(room.maxPlayer || 8); // API 응답에서 maxPlayer 값을 설정
          } else {
            navigate('/test-lobby');
          }
        }
      } catch (error) {
        console.error('Failed to fetch room info:', error);
      }
    };

    fetchRoomInfo();

    return () => {
      stompClient?.deactivate();
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
        <TestGameHeader
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
                <TestGameStatus gameState={gameState} />
              </div>
            ) : (
              <TestWaitingRoom
                players={players}
                isHost={isHost}
                currentPlayerId={currentPlayerId}
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
