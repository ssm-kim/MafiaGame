import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/axios';
import { Room } from '@/types/room';
import { Header } from '@/components/lobby/Header';
import { SearchBar } from '@/components/lobby/SearchBar';
import { RoomList } from '@/components/lobby/RoomList';
import { CreateRoomModal } from '@/components/lobby/CreateRoomModal';
import NicknameModal from '@/components/nickname/NicknameModal';
import roomApi from '@/api/roomApi';

export interface LoginResponse {
  memberId: number;
  nickname: string;
}

const initialRoomState = {
  name: '',
  maxPlayers: 8,
  password: '',
  mafia: 2,
  police: 1,
  doctor: 1,
  dayTime: 180,
  nightTime: 180,
  voteTime: 60,
};

function GameLobby() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRoom, setNewRoom] = useState(initialRoomState);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const initializeAndSubscribe = async () => {
      try {
        await roomApi.initializeWebSocket();

        // 로비 구독
        roomApi.subscribeLobby((updatedRooms) => {
          setRooms(updatedRooms);
        });

        // 초기 데이터 로드
        const [roomsResponse, userResponse] = await Promise.all([
          roomApi.getRooms(),
          api.get('/api/member'),
        ]);

        setRooms(roomsResponse.data.result);
        if (userResponse.data.isSuccess) {
          setNickname(userResponse.data.result.nickname);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    initializeAndSubscribe();

    return () => {
      roomApi.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await api.post('/api/logout');
      if (response.data.isSuccess) {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Failed to logout:', error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert('로그아웃 처리 중 오류가 발생했습니다.');
      } else {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const handleCreateRoom = async () => {
    try {
      const createRoomData = {
        title: newRoom.name || '테스트방',
        requiredPlayers: newRoom.maxPlayers,
        password: newRoom.password || undefined,
        gameOption: {},
      };

      console.log('방 생성 요청 데이터:', createRoomData);
      const response = await roomApi.createRoom(createRoomData);
      console.log('방 생성 응답:', response.data);

      const roomId = response.data.result?.roomId;
      console.log('생성된 방 ID:', roomId);

      if (!roomId) {
        throw new Error('방 ID를 받지 못했습니다');
      }

      console.log(`이동할 경로: /game/${roomId}`);
      navigate(`/game/${roomId}`);
    } catch (error) {
      console.error('방 생성 에러:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        alert('API 경로를 찾을 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        return;
      }
      alert('방 생성에 실패했습니다.');
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      await roomApi.joinRoom(roomId);
      navigate(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('방 입장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleNicknameChange = async (newNickname: string) => {
    try {
      const response = await api.patch('/api/member/nickname', {
        nickname: newNickname,
      });

      if (response.data.isSuccess) {
        setNickname(newNickname);
        setShowNicknameModal(false);
      }
    } catch (error) {
      console.error('Failed to change nickname:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          alert('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
        } else {
          alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-4"
      style={{
        backgroundImage: 'url("/images/splash_background.jpg")',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      <div className="fixed inset-0 bg-black bg-opacity-80" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNicknameModal(true)}
            className="px-4 py-2 bg-red-900 bg-opacity-90 text-red-300 text-sm rounded-md hover:bg-red-800 
           transition-all duration-300 border-2 border-red-700 hover:border-red-500 
           shadow-lg hover:shadow-red-900/50"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            정보 변경
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-900 bg-opacity-90 text-gray-300 text-sm rounded-md 
            hover:bg-gray-800 transition-all duration-300 border-2 border-gray-700 
            hover:border-gray-500 shadow-lg hover:shadow-gray-900/50"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            탈출하기
          </button>
        </div>

        <div className="absolute top-4 right-4">
          <div
            className="text-red-300 px-6 py-3 bg-red-900 bg-opacity-70 rounded-md 
          border-2 border-red-700 shadow-lg shadow-red-900/50 animate-pulse"
          >
            <span
              className="flex items-center gap-2"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              {nickname}님 생존중
            </span>
          </div>
        </div>

        <div className="text-center mb-16 pt-20">
          <Header
            title="생존자 대피소"
            subtitle="※ 주의: 감염자 출현 지역. 안전한 대피소를 찾으시오. ※"
          />
        </div>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateRoom={() => setShowCreateModal(true)}
        />

        <div
          className="mt-8 text-red-500 text-sm text-center mb-4"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          !!! 경고: 주변 지역 감염자 다수 발견. 즉시 안전한 방으로 대피하시오 !!!
        </div>

        <RoomList
          rooms={rooms}
          searchTerm={searchTerm}
          onJoinRoom={handleJoinRoom}
        />

        <CreateRoomModal
          show={showCreateModal}
          roomData={newRoom}
          onRoomDataChange={setNewRoom}
          onClose={() => {
            setShowCreateModal(false);
            setNewRoom(initialRoomState);
          }}
          onCreateRoom={handleCreateRoom}
        />

        <NicknameModal
          show={showNicknameModal}
          onSubmit={handleNicknameChange}
        />
      </div>
    </div>
  );
}

export default GameLobby;

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import api from '../../api/axios';
// import { Room } from '@/types/room';
// import { Header } from '@/components/lobby/Header';
// import { SearchBar } from '@/components/lobby/SearchBar';
// import { RoomList } from '@/components/lobby/RoomList';
// import { CreateRoomModal } from '@/components/lobby/CreateRoomModal';
// import NicknameModal from '@/components/nickname/NicknameModal';
// import roomApi from '@/api/roomApi';

// export interface LoginResponse {
//   memberId: number;
//   nickname: string;
// }

// const initialRoomState = {
//   name: '',
//   maxPlayers: 8,
//   password: '',
//   mafia: 2,
//   police: 1,
//   doctor: 1,
//   dayTime: 180,
//   nightTime: 180,
//   voteTime: 60,
// };

// function GameLobby() {
//   const navigate = useNavigate();
//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showNicknameModal, setShowNicknameModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [newRoom, setNewRoom] = useState(initialRoomState);
//   const [nickname, setNickname] = useState(''); // 카카오 로그인 시 받아온 닉네임으로 초기화되어야 함

//   useEffect(() => {
//     const fetchRoomsAndUserInfo = async () => {
//       try {
//         // 방 목록 가져오기
//         const roomsResponse = await roomApi.getRooms();
//         console.log('방 목록 응답:', roomsResponse.data);
//         setRooms(roomsResponse.data.result);

//         // 유저 정보 가져오기
//         const userResponse = await api.get('/api/member');
//         console.log(userResponse);
//         if (userResponse.data.isSuccess) {
//           setNickname(userResponse.data.result.nickname);
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error);
//       }
//     };

//     fetchRoomsAndUserInfo();

//     //   const interval = setInterval(fetchRooms, 5000);
//     //   return () => clearInterval(interval);
//     // }, [navigate]);
//     const interval = setInterval(async () => {
//       try {
//         const roomsResponse = await roomApi.getRooms();
//         setRooms(roomsResponse.data.result);
//       } catch (error) {
//         console.error('Failed to fetch rooms:', error);
//       }
//     }, 100000000000);

//     return () => clearInterval(interval);
//   }, [navigate]);

//   const handleLogout = async () => {
//     try {
//       const response = await api.post('/api/logout');
//       if (response.data.isSuccess) {
//         navigate('/login', { replace: true });
//       }
//     } catch (error) {
//       console.error('Failed to logout:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('로그아웃 처리 중 오류가 발생했습니다.');
//       } else {
//         alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
//       }
//     }
//   };

//   const handleCreateRoom = async () => {
//     try {
//       const createRoomData = {
//         title: newRoom.name || '테스트방',
//         requiredPlayers: newRoom.maxPlayers,
//         password: newRoom.password || undefined,
//         gameOption: {},
//       };

//       console.log('방 생성 요청 데이터:', createRoomData);
//       const response = await roomApi.createRoom(createRoomData);
//       console.log('방 생성 응답:', response.data);

//       // 배열로 오는 응답 처리
//       const roomId = response.data.result?.roomId;
//       console.log('생성된 방 ID:', roomId);

//       console.log(response.data.result);
//       if (!roomId) {
//         throw new Error('방 ID를 받지 못했습니다');
//       }

//       console.log(`이동할 경로: /game/${roomId}`);
//       navigate(`/game/${roomId}`);
//     } catch (error) {
//       console.error('방 생성 에러:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 404) {
//         alert('API 경로를 찾을 수 없습니다. 서버가 실행 중인지 확인해주세요.');
//         return;
//       }
//       alert('방 생성에 실패했습니다.');
//     }
//   };

//   const handleJoinRoom = async (roomId: number) => {
//     try {
//       await roomApi.joinRoom(roomId);
//       navigate(`/game/${roomId}`);
//     } catch (error) {
//       console.error('Failed to join room:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('방 입장에 실패했습니다. 정원이 초과되었을 수 있습니다.');
//       }
//     }
//   };

//   const handleNicknameChange = async (newNickname: string) => {
//     try {
//       const response = await api.patch('/api/member/nickname', {
//         nickname: newNickname,
//       });

//       if (response.data.isSuccess) {
//         setNickname(newNickname);
//         setShowNicknameModal(false);
//       }
//     } catch (error) {
//       console.error('Failed to change nickname:', error);
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 400) {
//           alert('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
//         } else {
//           alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
//         }
//       }
//     }
//   };

//   return (
//     <div
//       className="min-h-screen bg-cover bg-center bg-fixed p-4"
//       style={{
//         backgroundImage: 'url("/images/splash_background.jpg")',
//         backgroundColor: 'rgba(0, 0, 0, 0.9)', // 더 어둡게
//       }}
//     >
//       <div className="fixed inset-0 bg-black bg-opacity-80" /> {/* 배경 더 어둡게 */}
//       <div className="relative z-10 max-w-6xl mx-auto">
//         {/* 좌측버튼 */}
//         <div className="absolute top-4 left-4 flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => setShowNicknameModal(true)}
//             className="px-4 py-2 bg-red-900 bg-opacity-90 text-red-300 text-sm rounded-md hover:bg-red-800
//            transition-all duration-300 border-2 border-red-700 hover:border-red-500
//            shadow-lg hover:shadow-red-900/50"
//             style={{ fontFamily: 'BMEuljiro10yearslater' }}
//           >
//             정보 변경
//           </button>
//           <button
//             type="button"
//             onClick={handleLogout}
//             className="px-4 py-2 bg-gray-900 bg-opacity-90 text-gray-300 text-sm rounded-md
//             hover:bg-gray-800 transition-all duration-300 border-2 border-gray-700
//             hover:border-gray-500 shadow-lg hover:shadow-gray-900/50"
//             style={{ fontFamily: 'BMEuljiro10yearslater' }}
//           >
//             탈출하기
//           </button>
//         </div>

//         {/* 상단 우측 생존자 상태 - 더 긴박한 느낌으로 */}
//         <div className="absolute top-4 right-4">
//           <div
//             className="text-red-300 px-6 py-3 bg-red-900 bg-opacity-70 rounded-md
//           border-2 border-red-700 shadow-lg shadow-red-900/50 animate-pulse"
//           >
//             <span
//               className="flex items-center gap-2"
//               style={{ fontFamily: 'BMEuljiro10yearslater' }}
//             >
//               <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
//               {nickname}님 생존중
//             </span>
//           </div>
//         </div>

//         <div className="text-center mb-16 pt-20">
//           {' '}
//           {/* 간격 조정 */}
//           <Header
//             title="생존자 대피소"
//             subtitle="※ 주의: 감염자 출현 지역. 안전한 대피소를 찾으시오. ※"
//           />
//         </div>

//         <SearchBar
//           searchTerm={searchTerm}
//           onSearchChange={setSearchTerm}
//           onCreateRoom={() => setShowCreateModal(true)}
//         />

//         <div
//           className="mt-8 text-red-500 text-sm text-center mb-4"
//           style={{ fontFamily: 'BMEuljiro10yearslater' }}
//         >
//           !!! 경고: 주변 지역 감염자 다수 발견. 즉시 안전한 방으로 대피하시오 !!!
//         </div>

//         <RoomList
//           rooms={rooms}
//           searchTerm={searchTerm}
//           onJoinRoom={handleJoinRoom}
//         />

//         {/* 모달들은 기존 기능 유지 */}
//         <CreateRoomModal
//           show={showCreateModal}
//           roomData={newRoom}
//           onRoomDataChange={setNewRoom}
//           onClose={() => {
//             setShowCreateModal(false);
//             setNewRoom(initialRoomState);
//           }}
//           onCreateRoom={handleCreateRoom}
//         />

//         <NicknameModal
//           show={showNicknameModal}
//           onSubmit={handleNicknameChange}
//         />
//       </div>
//     </div>
//   );
// }

// export default GameLobby;

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import api from '../../api/axios';
// import { Room } from '@/types/room';
// import { Header } from '@/components/lobby/Header';
// import { SearchBar } from '@/components/lobby/SearchBar';
// import { RoomList } from '@/components/lobby/RoomList';
// import { CreateRoomModal } from '@/components/lobby/CreateRoomModal';
// import NicknameModal from '@/components/nickname/NicknameModal';
// import roomApi from '@/api/roomApi';

// export interface LoginResponse {
//   memberId: number;
//   nickname: string;
// }

// const initialRoomState = {
//   name: '',
//   maxPlayers: 8,
//   password: '',
//   mafia: 2,
//   police: 1,
//   doctor: 1,
//   dayTime: 180,
//   nightTime: 180,
//   voteTime: 60,
// };

// function GameLobby() {
//   const navigate = useNavigate();
//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showNicknameModal, setShowNicknameModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [newRoom, setNewRoom] = useState(initialRoomState);
//   const [nickname, setNickname] = useState(''); // 카카오 로그인 시 받아온 닉네임으로 초기화되어야 함

//   useEffect(() => {
//     const fetchRoomsAndUserInfo = async () => {
//       try {
//         // 방 목록 가져오기
//         const roomsResponse = await roomApi.getRooms();
//         console.log('방 목록 응답:', roomsResponse.data);
//         setRooms(roomsResponse.data.result);

//         // 유저 정보 가져오기
//         const userResponse = await api.get('/api/member');
//         console.log(userResponse);
//         if (userResponse.data.isSuccess) {
//           setNickname(userResponse.data.result.nickname);
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error);
//       }
//     };

//     fetchRoomsAndUserInfo();

//     //   const interval = setInterval(fetchRooms, 5000);
//     //   return () => clearInterval(interval);
//     // }, [navigate]);
//     const interval = setInterval(async () => {
//       try {
//         const roomsResponse = await roomApi.getRooms();
//         setRooms(roomsResponse.data.result);
//       } catch (error) {
//         console.error('Failed to fetch rooms:', error);
//       }
//     }, 100000000000);

//     return () => clearInterval(interval);
//   }, [navigate]);

//   const handleLogout = async () => {
//     try {
//       const response = await axios.post('/api/logout');
//       if (response.data.isSuccess) {
//         navigate('/login', { replace: true });
//       }
//     } catch (error) {
//       console.error('Failed to logout:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('로그아웃 처리 중 오류가 발생했습니다.');
//       } else {
//         alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
//       }
//     }
//   };

//   const handleCreateRoom = async () => {
//     try {
//       const createRoomData = {
//         roomTitle: newRoom.name || '테스트방',
//         requiredPlayer: newRoom.maxPlayers,
//         roomPassword: newRoom.password || '',
//       };

//       console.log('방 생성 요청 데이터:', createRoomData);
//       const response = await roomApi.createRoom(createRoomData);
//       console.log('방 생성 응답:', response.data);

//       // 배열로 오는 응답 처리
//       const roomId = response.data.result?.roomId;
//       console.log('생성된 방 ID:', roomId);

//       console.log(response.data.result);
//       if (!roomId) {
//         throw new Error('방 ID를 받지 못했습니다');
//       }

//       console.log(`이동할 경로: /game/${roomId}`);
//       navigate(`/game/${roomId}`);
//     } catch (error) {
//       console.error('방 생성 에러:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 404) {
//         alert('API 경로를 찾을 수 없습니다. 서버가 실행 중인지 확인해주세요.');
//         return;
//       }
//       alert('방 생성에 실패했습니다.');
//     }
//   };

//   const handleJoinRoom = async (roomId: number) => {
//     try {
//       await roomApi.joinRoom(roomId);
//       navigate(`/game/${roomId}`);
//     } catch (error) {
//       console.error('Failed to join room:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 400) {
//         alert('방 입장에 실패했습니다. 정원이 초과되었을 수 있습니다.');
//       }
//     }
//   };

//   const handleNicknameChange = async (newNickname: string) => {
//     try {
//       const response = await api.patch('/api/member/nickname', {
//         nickname: newNickname,
//       });

//       if (response.data.isSuccess) {
//         setNickname(newNickname);
//         setShowNicknameModal(false);
//       }
//     } catch (error) {
//       console.error('Failed to change nickname:', error);
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 400) {
//           alert('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
//         } else {
//           alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
//         }
//       }
//     }
//   };

//   return (
//     <div
//       className="min-h-screen bg-cover bg-center bg-fixed p-4"
//       style={{
//         backgroundImage: 'url("/images/splash_background.jpg")',
//       }}
//     >
//       <div className="fixed inset-0 bg-black bg-opacity-70" />

//       <div className="relative z-10 max-w-6xl mx-auto">
//         {/* 상단 좌측 버튼들 */}
//         <div className="absolute top-4 left-4 flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => setShowNicknameModal(true)}
//             className="px-3 py-1 bg-red-900 bg-opacity-80 text-red-200 text-sm rounded hover:bg-red-800 transition-colors duration-300 border border-red-700"
//             style={{ fontFamily: 'BMEuljiro10yearslater' }}
//           >
//             정보 변경
//           </button>
//           <button
//             type="button"
//             onClick={handleLogout}
//             className="px-3 py-1 bg-gray-800 bg-opacity-80 text-gray-200 text-sm rounded hover:bg-gray-700 transition-colors duration-300 border border-gray-600"
//             style={{ fontFamily: 'BMEuljiro10yearslater' }}
//           >
//             탈출하기
//           </button>
//         </div>

//         {/* 상단 우측 닉네임 */}
//         <div className="absolute top-4 right-4">
//           <div className="text-red-200 px-4 py-2 bg-red-950 bg-opacity-50 rounded border border-red-800">
//             <span style={{ fontFamily: 'BMEuljiro10yearslater' }}>{nickname}님 생존중</span>
//           </div>
//         </div>

//         <div className="text-center mb-12 pt-16">
//           <Header
//             title="생존자 대피소"
//             subtitle="안전한 방을 찾거나 새로운 대피소를 만드세요"
//           />
//         </div>

//         <SearchBar
//           searchTerm={searchTerm}
//           onSearchChange={setSearchTerm}
//           onCreateRoom={() => setShowCreateModal(true)}
//         />

//         <RoomList
//           rooms={rooms}
//           searchTerm={searchTerm}
//           onJoinRoom={handleJoinRoom}
//         />

//         <CreateRoomModal
//           show={showCreateModal}
//           roomData={newRoom}
//           onRoomDataChange={setNewRoom}
//           onClose={() => {
//             setShowCreateModal(false);
//             setNewRoom(initialRoomState);
//           }}
//           onCreateRoom={handleCreateRoom}
//         />

//         <NicknameModal
//           show={showNicknameModal}
//           // onClose={() => setShowNicknameModal(false)}
//           onSubmit={handleNicknameChange}
//         />
//       </div>
//     </div>
//   );
// }

// export default GameLobby;
