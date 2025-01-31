import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import roomApi from '@/api/roomApi';
import { Room } from '@/types/room';
import { Header } from '@/components/lobby/Header';
import { SearchBar } from '@/components/lobby/SearchBar';
import { RoomList } from '@/components/lobby/RoomList';
import { CreateRoomModal } from '@/components/lobby/CreateRoomModal';
import { NicknameModal } from '@/components/nickname/NicknameModal';

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
  const [nickname, setNickname] = useState('생존자'); // 카카오 로그인 시 받아온 닉네임으로 초기화되어야 함

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomApi.getRooms();
        setRooms(response.data.result);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          navigate('/login', { replace: true });
        }
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await axios.post('/api/logout');
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
        roomTitle: newRoom.name,
        maxPlayers: newRoom.maxPlayers,
        roomOption: 'BASIC',
        isVoice: false,
      };

      const response = await roomApi.createRoom(createRoomData);
      await roomApi.joinRoom(response.data.result.roomId);
      navigate(`/game/${response.data.result.roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await roomApi.joinRoom(roomId);
      navigate(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleNicknameChange = async (newNickname: string) => {
    try {
      const response = await axios.post('/api/member/nickname', {
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
      }}
    >
      <div className="fixed inset-0 bg-black bg-opacity-70" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 상단 좌측 버튼들 */}
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNicknameModal(true)}
            className="px-3 py-1 bg-red-900 bg-opacity-80 text-red-200 text-sm rounded hover:bg-red-800 transition-colors duration-300 border border-red-700"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            정보 변경
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-800 bg-opacity-80 text-gray-200 text-sm rounded hover:bg-gray-700 transition-colors duration-300 border border-gray-600"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            탈출하기
          </button>
        </div>

        {/* 상단 우측 닉네임 */}
        <div className="absolute top-4 right-4">
          <div className="text-red-200 px-4 py-2 bg-red-950 bg-opacity-50 rounded border border-red-800">
            <span style={{ fontFamily: 'BMEuljiro10yearslater' }}>{nickname}님 생존중</span>
          </div>
        </div>

        <div className="text-center mb-12 pt-16">
          <Header
            title="생존자 대피소"
            subtitle="안전한 방을 찾거나 새로운 대피소를 만드세요"
          />
        </div>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateRoom={() => setShowCreateModal(true)}
        />

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
          onClose={() => setShowNicknameModal(false)}
          onSubmit={handleNicknameChange}
        />
      </div>
    </div>
  );
}

export default GameLobby;
