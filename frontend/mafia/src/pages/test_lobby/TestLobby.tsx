import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import roomApi from '@/api/roomApi';
import { Room } from '@/types/room';
// import { TestHeader } from '@/components/lobby/test/TestHeader';
// import { TestSearchBar } from '@/components/lobby/test/TestSearchBar';
// import { TestRoomList } from '@/components/lobby/test/TestRoomList';
// import { TestCreateRoomModal } from '@/components/lobby/test/TestCreateRoomModal';
import NicknameModal from '@/components/nickname/NicknameModal';
// import roomApi from '@/api/roomApi';
import TestRoomApi from '../../api/TestRoomApi';
import TestCreateRoomModal from '../../components/testlobby_modal/TestCreateRoomModal';
import TestHeader from '../../components/testlobby_modal/TestHeader';
import TestSearchBar from '../../components/testlobby_modal/TestSearchBar';
import TestRoomList from '../../components/testlobby_modal/TestRoomList';

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

function TestLobby() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [testMemberId, setTestMemberId] = useState<number>(1);
  const [newRoom, setNewRoom] = useState(initialRoomState);
  const [nickname, setNickname] = useState(''); // 카카오 로그인 시 받아온 닉네임으로 초기화되어야 함

  // useEffect(() => {
  //   const fetchRooms = async () => {
  //     try {
  //       const response = await TestRoomApi.getRooms();
  //       console.log('방 목록 응답:', response.data);
  //       setRooms(response.data.result);
  //     } catch (error) {
  //       console.error('Failed to fetch rooms:', error);
  //     }
  //   };
  //   fetchRooms();
  //   const interval = setInterval(fetchRooms, 100000000000);
  //   return () => clearInterval(interval);
  // }, [navigate]);
  useEffect(() => {
    const fetchRoomsAndUserInfo = async () => {
      try {
        // 방 목록 가져오기
        const roomsResponse = await TestRoomApi.getRooms();
        console.log('방 목록 응답:', roomsResponse.data);
        setRooms(roomsResponse.data.result);

        // 유저 정보 가져오기
        const userResponse = await axios.get('/api/member');
        console.log(userResponse);
        if (userResponse.data.isSuccess) {
          setNickname(userResponse.data.result.nickname);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchRoomsAndUserInfo();

    // 주기적으로 방 목록만 업데이트
    const interval = setInterval(async () => {
      try {
        const roomsResponse = await TestRoomApi.getRooms();
        setRooms(roomsResponse.data.result);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      }
    }, 100000000000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    try {
      TestRoomApi.logout();
      navigate('/test-login', { replace: true });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // const handleCreateRoom = async () => {
  //   try {
  //     const createRoomData = {
  //       roomTitle: newRoom.name || '테스트방',
  //       requiredPlayer: 4,
  //       roomPassword: newRoom.password || '',
  //     };

  //     console.log('방 생성 요청 데이터:', createRoomData);
  //     const response = await TestRoomApi.createRoom(createRoomData);
  //     console.log('방 생성 응답:', response.data);

  //     const { roomId } = response.data.result;
  //     console.log('생성된 방 ID:', roomId);

  //     if (!roomId) {
  //       throw new Error('방 ID를 받지 못했습니다');
  //     }

  //     navigate(`/game-test/${roomId}`);
  //   } catch (error) {
  //     console.error('방 생성 에러:', error);
  //     if (axios.isAxiosError(error)) {
  //       console.error('서버 응답:', error.response?.data);
  //     }
  //     alert('방 생성 실패');
  //   }
  // };
  const handleCreateRoom = async () => {
    try {
      const createRoomData = {
        roomTitle: newRoom.name || '테스트방',
        requiredPlayer: 4,
        roomPassword: newRoom.password || '',
      };

      console.log('방 생성 요청 데이터:', createRoomData);
      const response = await TestRoomApi.createRoom(createRoomData);
      console.log('방 생성 응답:', response.data);

      // 배열로 오는 응답 처리
      const roomId = response.data.result?.roomId;
      console.log('생성된 방 ID:', roomId);

      console.log(response.data.result);
      if (!roomId) {
        throw new Error('방 ID를 받지 못했습니다');
      }

      console.log(`이동할 경로: /game-test/${roomId}`);
      navigate(`/game-test/${roomId}`);
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
      const memberId = Number(localStorage.getItem('memberId'));
      await TestRoomApi.joinRoom(roomId, memberId);
      navigate(`/game-test/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('방 입장에 실패했습니다.');
    }
  };
  const handleNicknameChange = async (newNickname: string) => {
    try {
      const response = await axios.post('/nickname', {
        nickname: newNickname,
      });

      if (response.data.isSuccess) {
        setNickname(response.data.result.nickname);
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
          <TestHeader
            title="생존자 대피소"
            subtitle="안전한 방을 찾거나 새로운 대피소를 만드세요"
          />
        </div>

        <TestSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateRoom={() => setShowCreateModal(true)}
        />

        <TestRoomList
          rooms={rooms}
          searchTerm={searchTerm}
          onJoinRoom={handleJoinRoom}
          // maxPlayers={maxPlayers}
        />

        <TestCreateRoomModal
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

export default TestLobby;
