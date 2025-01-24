// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { roomApi } from "../../api/roomApi";
// import { Room } from "../../types/room";
// import { Header } from "../../components/lobby/Header";
// import { SearchBar } from "../../components/lobby/SearchBar";
// import { RoomList } from "../../components/lobby/RoomList";
// import { CreateRoomModal } from "../../components/lobby/CreateRoomModal";
// import { NicknameModal } from "../../components/nickname/NicknameModal";

// const initialRoomState = {
//  name: '',
//  maxPlayers: 8,
//  password: '',
//  mafia: 2,
//  police: 1,
//  doctor: 1,
//  dayTime: 180,
//  nightTime: 180,
//  voteTime: 60
// };

// const GameLobby = () => {
//  const navigate = useNavigate();
//  const [rooms, setRooms] = useState<Room[]>([]);
//  const [showCreateModal, setShowCreateModal] = useState(false);
//  const [showNicknameModal, setShowNicknameModal] = useState(false);
//  const [searchTerm, setSearchTerm] = useState('');
//  const [newRoom, setNewRoom] = useState(initialRoomState);

//  useEffect(() => {
//    const fetchRooms = async () => {
//      try {
//        const response = await roomApi.getRooms();
//        setRooms(response.data);
//      } catch (error) {
//        console.error('Failed to fetch rooms:', error);
//      }
//    };

//    fetchRooms();
//    const interval = setInterval(fetchRooms, 5000);
//    return () => clearInterval(interval);
//  }, []);

//  const handleCreateRoom = async () => {
//    try {
//      const response = await roomApi.createRoom(newRoom);
//      await roomApi.joinRoom(response.data.id);
//      navigate(`/game/${response.data.id}`);
//    } catch (error) {
//      console.error('Failed to create room:', error);
//    }
//  };

//  const handleJoinRoom = async (roomId: string) => {
//    try {
//      await roomApi.joinRoom(roomId);
//      navigate(`/game/${roomId}`);
//    } catch (error) {
//      console.error('Failed to join room:', error);
//    }
//  };

//  const handleNicknameChange = async (nickname: string) => {
//    try {
//      // TODO: API 연동
//      // await axios.post('/api/member/nickname', { nickname });
//      setShowNicknameModal(false);
//    } catch (error) {
//      console.error('Failed to change nickname:', error);
//    }
//  };

//  return (
//   <div 
//   className="min-h-screen bg-cover bg-center bg-fixed p-4"
//   style={{
//     backgroundImage: 'url("/images/splash_background.jpg")'
//   }}
// >
//   <div className="fixed inset-0 bg-black bg-opacity-70"></div>
  
//   <div className="relative z-10">
//     <div className="text-center mb-8">
//       <Header 
//         title="생존자 대피소" 
//         subtitle="안전한 방을 찾거나 새로운 대피소를 만드세요"
//       />
//       <button
//         onClick={() => setShowNicknameModal(true)}
//         className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:scale-105 border border-red-400 shadow-lg hover:shadow-red-500/50"
//       >
//         생존자 정보 변경
//       </button>
//     </div>
       
//        <SearchBar 
//          searchTerm={searchTerm}
//          onSearchChange={setSearchTerm}
//          onCreateRoom={() => setShowCreateModal(true)}
//        />

//        <RoomList 
//          rooms={rooms}
//          searchTerm={searchTerm}
//          onJoinRoom={handleJoinRoom}
//        />

//        <CreateRoomModal 
//          show={showCreateModal}
//          roomData={newRoom}
//          onRoomDataChange={setNewRoom}
//          onClose={() => {
//            setShowCreateModal(false);
//            setNewRoom(initialRoomState);
//          }}
//          onCreateRoom={handleCreateRoom}
//        />

//        <NicknameModal 
//          show={showNicknameModal}
//          onClose={() => setShowNicknameModal(false)}
//          onSubmit={handleNicknameChange}
//        />
//      </div>
//    </div>
//  );
// };

// export default GameLobby;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../../api/roomApi";
import { Room } from "../../types/room";
import { Header } from "../../components/lobby/Header";
import { SearchBar } from "../../components/lobby/SearchBar";
import { RoomList } from "../../components/lobby/RoomList";
import { CreateRoomModal } from "../../components/lobby/CreateRoomModal";
import { NicknameModal } from "../../components/nickname/NicknameModal";

const initialRoomState = {
 name: '',
 maxPlayers: 8,
 password: '',
 mafia: 2,
 police: 1,
 doctor: 1,
 dayTime: 180,
 nightTime: 180,
 voteTime: 60
};

const GameLobby = () => {
 const navigate = useNavigate();
 const [rooms, setRooms] = useState<Room[]>([]);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [showNicknameModal, setShowNicknameModal] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [newRoom, setNewRoom] = useState(initialRoomState);

 useEffect(() => {
   const fetchRooms = async () => {
     try {
       const response = await roomApi.getRooms();
       setRooms(response.data.result);
     } catch (error) {
       console.error('Failed to fetch rooms:', error);
     }
   };

   fetchRooms();
   const interval = setInterval(fetchRooms, 5000);
   return () => clearInterval(interval);
 }, []);

 const handleCreateRoom = async () => {
   try {
     const response = await roomApi.createRoom(newRoom);
     await roomApi.joinRoom(response.data.id);
     navigate(`/game/${response.data.id}`);
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

 const handleNicknameChange = async (nickname: string) => {
   try {
     // TODO: API 연동
     // await axios.post('/api/member/nickname', { nickname });
     setShowNicknameModal(false);
   } catch (error) {
     console.error('Failed to change nickname:', error);
   }
 };

 return (
   <div 
     className="min-h-screen bg-cover bg-center bg-fixed p-4"
     style={{
       backgroundImage: 'url("/images/splash_background.jpg")'
     }}
   >
     <div className="fixed inset-0 bg-black bg-opacity-70"></div>
     
     <div className="relative z-10 max-w-6xl mx-auto">
       <div className="text-center mb-12">
         <Header 
           title="생존자 대피소" 
           subtitle="안전한 방을 찾거나 새로운 대피소를 만드세요"
         />
         <button
           onClick={() => setShowNicknameModal(true)}
           className="mt-4 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:scale-105 border border-red-400 shadow-lg hover:shadow-red-500/50 font-bold tracking-wider"
           style={{ fontFamily: 'BMEuljiro10yearslater' }}
         >
           생존자 정보 변경
         </button>
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
};

export default GameLobby;