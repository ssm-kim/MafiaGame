import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectWebSocket, sendChatMessage } from '../../api/webSocket';
import { roomApi } from '../../api/roomApi';
import { Room } from "../../types/room";
import { ChatMessage } from "../../types/chat";

const GameRoom: React.FC = () => {
 const { roomId } = useParams<{ roomId: string }>();
 const navigate = useNavigate();
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [newMessage, setNewMessage] = useState('');
 const [gameState, setGameState] = useState<Room | null>(null);

 useEffect(() => {
   if (!roomId) return;

   const stompClient = connectWebSocket(
     roomId,
     (message) => {
       setMessages(prev => [...prev, message]);
     },
     (newGameState) => {
       setGameState(newGameState);
     }
   );

   const fetchRoomInfo = async () => {
     try {
       const response = await roomApi.getRoom(roomId);
       setGameState(response.data);
     } catch (error) {
       console.error('Failed to fetch room info:', error);
     }
   };
   
   fetchRoomInfo();

   return () => {
     stompClient?.deactivate();
   };
 }, [roomId]);

 const handleLeaveRoom = async () => {
   try {
     if (roomId) {
       await roomApi.leaveRoom(roomId);
       navigate('/game-lobby');
     }
   } catch (error) {
     console.error('Failed to leave room:', error);
   }
 };

 const handleSendMessage = (e: React.FormEvent) => {
   e.preventDefault();
   if (!newMessage.trim() || !roomId) return;

   sendChatMessage(roomId, newMessage);
   setMessages(prev => [...prev, {
     id: Date.now().toString(),
     senderName: '나',
     content: newMessage,
     timestamp: new Date().toISOString()
   }]);
   setNewMessage('');
 };

 return (
   <div 
     className="h-screen bg-cover bg-center bg-fixed"
     style={{
       backgroundImage: 'url("/images/splash_background.jpg")'
     }}
   >
     <div className="absolute inset-0 bg-black bg-opacity-70"></div>
     
     <div className="relative h-full z-10 p-4">
       {/* 헤더 */}
       <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-90 p-4 flex justify-between items-center border-b border-gray-800">
         <div className="flex items-center gap-4">
           <span className="text-red-500" style={{ fontFamily: 'BMEuljiro10yearslater' }}>대피소 #{roomId}</span>
           {gameState && (
             <>
               <span className="text-gray-600">|</span>
               <span className="text-gray-300">{gameState.name}</span>
             </>
           )}
         </div>
         <div className="flex items-center gap-4">
           <div className="text-gray-400 text-sm">
             생존자: {gameState?.currentPlayers ?? 0} / {gameState?.maxPlayers ?? 0}
           </div>
           <button 
             className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
             onClick={handleLeaveRoom}
           >
             대피소 나가기
           </button>
         </div>
       </div>

       <div className="flex h-full gap-4 pt-16">
         {/* 게임 화면 (게더타운 영역) */}
         <div className="flex-1">
           <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
             {gameState ? (
               <div className="relative h-full">
                 {/* 게더타운 영역 */}
                 <div className="absolute inset-0">
                   {/* 게더타운 컴포넌트가 들어갈 자리 */}
                 </div>

                 {/* 게임 상태 오버레이 */}
                 <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 p-3 rounded-lg border border-gray-800">
                   <h2 className="text-red-500 text-lg mb-2" style={{ fontFamily: 'BMEuljiro10yearslater' }}>
                     현재 상황
                   </h2>
                   <p className="text-gray-300 text-sm">게임 상태: {gameState.gameStatus}</p>
                 </div>
               </div>
             ) : (
               <div className="h-full flex items-center justify-center">
                 <div className="text-red-500 text-2xl animate-pulse" style={{ fontFamily: 'BMEuljiro10yearslater' }}>
                   시설 점검 중...
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* 채팅 영역 */}
         <div className="w-80 flex flex-col bg-gray-900 bg-opacity-90 rounded-lg border border-gray-800">
           <div className="p-3 border-b border-gray-800">
             <h3 className="text-red-500" style={{ fontFamily: 'BMEuljiro10yearslater' }}>
               비상 통신망
             </h3>
           </div>
           
           <div className="flex-1 p-4 overflow-y-auto">
             <div className="space-y-2">
               {messages.map((msg) => (
                 <div 
                   key={msg.id} 
                   className={`break-words p-2 rounded ${
                     msg.senderName === '나' 
                       ? 'bg-red-900 bg-opacity-30 ml-4' 
                       : 'bg-gray-800 bg-opacity-50 mr-4'
                   }`}
                 >
                   <span className="font-bold text-gray-300">{msg.senderName}: </span>
                   <span className="text-gray-100">{msg.content}</span>
                   <div className="text-xs text-gray-500 mt-1">
                     {new Date(msg.timestamp).toLocaleTimeString()}
                   </div>
                 </div>
               ))}
             </div>
           </div>

           <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
             <input
               type="text"
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder="메시지 입력..."
               className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </form>
         </div>
       </div>
     </div>
   </div>
 );
};

export default GameRoom;