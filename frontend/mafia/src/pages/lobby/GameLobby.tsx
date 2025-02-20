import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Info } from 'lucide-react';
import api from '@/api/axios';
import { Room } from '@/types/room';
import { Header } from '@/components/lobby/Header';
import { SearchBar } from '@/components/lobby/SearchBar';
import { RoomList } from '@/components/lobby/RoomList';
import { CreateRoomModal } from '@/components/lobby/CreateRoomModal';
import NicknameModal from '@/components/nickname/NicknameModal';
import roomApi from '@/api/roomApi';
import PasswordModal from '@/components/lobby/PasswordModal';
import GameRulesModal from '@/components/lobby/GameRulesModal';

export interface LoginResponse {
  memberId: number;
  nickname: string;
}

const initialRoomState = {
  title: '',
  requiredPlayers: 8,
  password: '',
  gameOption: {
    zombie: 2,
    mutant: 1,
    doctorSkillUsage: 2,
    nightTimeSec: 30,
    dayDisTimeSec: 60,
  },
};

function GameLobby() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRoom, setNewRoom] = useState(initialRoomState);
  const [nickname, setNickname] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    const initializeAndSubscribe = async () => {
      try {
        await roomApi.initializeWebSocket();

        roomApi.subscribeLobby(async (updatedRooms) => {
          const detailedRooms = await Promise.all(
            updatedRooms.map(async (room) => {
              try {
                const detailResponse = await roomApi.getRoom(room.roomId);
                return {
                  ...room,
                  hasPassword: Boolean(detailResponse.data.result.password),
                };
              } catch (error) {
                return {
                  ...room,
                  hasPassword: false,
                };
              }
            }),
          );
          setRooms(detailedRooms);
        });

        const [roomsResponse, userResponse] = await Promise.all([
          roomApi.getRooms(),
          api.get('/api/member'),
        ]);

        const initialDetailedRooms = await Promise.all(
          roomsResponse.data.result.map(async (room) => {
            try {
              const detailResponse = await roomApi.getRoom(room.roomId);
              return {
                ...room,
                hasPassword: Boolean(detailResponse.data.result.password),
              };
            } catch (error) {
              return {
                ...room,
                hasPassword: false,
              };
            }
          }),
        );

        setRooms(initialDetailedRooms);
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
        title: newRoom.title || '테스트방',
        requiredPlayers: newRoom.requiredPlayers,
        password: newRoom.password || undefined,
        gameOption: {
          zombie: newRoom.gameOption.zombie,
          mutant: newRoom.gameOption.mutant,
          doctorSkillUsage: newRoom.gameOption.doctorSkillUsage,
          nightTimeSec: newRoom.gameOption.nightTimeSec,
          dayDisTimeSec: newRoom.gameOption.dayDisTimeSec,
        },
      };
      const response = await roomApi.createRoom(createRoomData);
      const roomId = response.data.result?.roomId;

      if (roomId) {
        navigate(`/game/${roomId}`);
        setShowCreateModal(false);
        setNewRoom(initialRoomState);
      } else {
        throw new Error('방 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 생성 에러:', error);
      alert('방 생성에 실패했습니다.');
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      const roomResponse = await roomApi.getRoom(roomId);
      const room = roomResponse.data.result;
      const currentPlayers = Object.keys(room.participant).length;

      if (currentPlayers >= room.requiredPlayers) {
        alert('방이 가득 찼습니다.');
        return;
      }

      if (room.password) {
        setSelectedRoom(room);
        setShowPasswordModal(true);
        return;
      }

      await roomApi.joinRoom(roomId);
      navigate(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('방 입장에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedRoom) return;

    try {
      if (password === selectedRoom.password) {
        await roomApi.joinRoom(selectedRoom.roomId, password);
        setShowPasswordModal(false);
        navigate(`/game/${selectedRoom.roomId}`);
      } else {
        alert('보안 코드가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('방 입장에 실패했습니다. 다시 시도해주세요.');
      setShowPasswordModal(false);
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
      className="min-h-screen bg-cover bg-center bg-fixed p-2 sm:p-4 relative"
      style={{
        backgroundImage: 'url("/images/splash_background.jpg")',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      {/* Dark overlay with red tint */}
      <div className="fixed inset-0 bg-black bg-opacity-85">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-black/30 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-red-900/5 to-transparent opacity-50" />
      </div>

      {/* Atmospheric fog effect */}
      <div className="fixed inset-0 bg-gradient-to-t from-gray-900/30 via-transparent to-transparent animate-fog" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 상단 버튼들 반응형 조정 */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowNicknameModal(true)}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-red-900 bg-opacity-90 text-red-300 text-xs sm:text-sm rounded-md hover:bg-red-800 
             transition-all duration-300 border-2 border-red-700 hover:border-red-500 
             shadow-lg hover:shadow-red-900/50"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            정보 변경
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 bg-opacity-90 text-gray-300 text-xs sm:text-sm rounded-md 
              hover:bg-gray-800 transition-all duration-300 border-2 border-gray-700 
              hover:border-gray-500 shadow-lg hover:shadow-gray-900/50"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            탈출하기
          </button>
        </div>

        {/* 우측 상단 유저 정보 */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <div
            className="text-red-300 px-4 sm:px-6 py-2 sm:py-3 bg-red-900 bg-opacity-70 rounded-md 
            border-2 border-red-700 shadow-lg shadow-red-900/50 animate-pulse"
          >
            <span
              className="flex items-center gap-2 text-xs sm:text-sm"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              {nickname}님 생존중
            </span>
          </div>
        </div>

        {/* 헤더 영역 */}
        <div className="text-center mb-8 sm:mb-16 pt-16 sm:pt-20">
          <Header
            title={<span className="text-xl sm:text-3xl md:text-4xl">생존자 대피소</span>}
            subtitle={
              <span className="text-sm sm:text-base">
                ※ 주의: 감염자 출현 지역. 안전한 대피소를 찾으시오. ※
              </span>
            }
          />
        </div>

        {/* 검색바와 경고 메시지 */}
        <div className="px-2 sm:px-0">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreateRoom={() => setShowCreateModal(true)}
          />
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="ml-4 px-4 py-2 bg-gray-900 bg-opacity-90 text-gray-300 rounded-md 
    hover:bg-gray-800 transition-all duration-300 border-2 border-gray-700 
    hover:border-gray-500 shadow-lg hover:shadow-gray-900/50 flex items-center gap-2"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            <Info size={18} />
            생존 규칙
          </button>

          <div
            className="mt-4 sm:mt-8 text-red-500 text-xs sm:text-sm text-center mb-4"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            !!! 경고: 주변 지역 감염자 다수 발견. 즉시 안전한 방으로 대피하시오 !!!
          </div>
        </div>

        {/* 방 목록 */}
        <div className="px-2 sm:px-0">
          <RoomList
            rooms={rooms}
            searchTerm={searchTerm}
            onJoinRoom={handleJoinRoom}
          />
        </div>

        {/* 모달들 */}
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

        <PasswordModal
          show={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
        />

        <GameRulesModal
          show={showRulesModal}
          onClose={() => setShowRulesModal(false)}
        />
      </div>
    </div>
  );
}

export default GameLobby;
