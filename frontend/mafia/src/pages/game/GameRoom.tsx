
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectWebSocket, sendChatMessage } from '../../api/webSocket';
import { roomApi } from '../../api/roomApi';
import { Room } from "../../types/room";
import { ChatMessage } from "../../types/chat";
import { GameHeader } from '../../components/gameroom/GameHeader';
import { GameStatus } from '../../components/gameroom/GameStatus';
import { ChatWindow } from '../../components/gameroom/ChatWindow';

const GameRoom: React.FC = () => {
 // roomId 가져옴
 const { roomId } = useParams<{ roomId: string }>();
 const navigate = useNavigate();
 // 채팅 메시지 저장 (배열)
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 // 유저가 입력중인 메시지
 const [newMessage, setNewMessage] = useState('');
 // 게임방의 현재 상태 정보
 const [gameState, setGameState] = useState<Room | null>(null);
 const [voteTarget, setVoteTarget] = useState<string | null>(null);
 const [players] = useState([
   { id: '1', name: '생존자 1' },
   { id: '2', name: '생존자 2' },
   { id: '3', name: '생존자 3' },
   { id: '4', name: '생존자 4' },
 ]);

 // 화면 처음 뜰 때 실행 기능
 useEffect(() => {
   // 방 번호 없으면 아무것도 안함
   if (!roomId) return;

   // 실시간 통신 연결 
   const stompClient = connectWebSocket(
     // 방 번호
     roomId,
     (message) => { //새 메시지 오면 실행할 함수
       // 이전 메시지 목록에 새 메시지 추가하는 코드
       setMessages(prev => [...prev, message]);
     },
     (newGameState) => {//게임 상태 변하면 실행할 함수
       //게임 상태 업데이트
       setGameState(newGameState);
     }
   );

   //방 정보 가져오는 코드
   const fetchRoomInfo = async () => {
     try {
       // 서버에 방 정보 요청
       const response = await roomApi.getRoom(roomId);
       setGameState(response.data.result);//받아온 정보로 게임 상태 설정
     } catch (error) {
       //error 발생하면 기록함
       console.error('Failed to fetch room info:', error);
     }
   };

   //방 정보 가져오기 실행
   fetchRoomInfo();

   //화면 벗어날 때 실행되는 작업
   return () => {
     stompClient?.deactivate();//실시간 통신 연결 끊음
   };
 }, [roomId]);//roomId 바뀔 때마다 이 기능 다시 실행

 // 방 나가기
 const handleLeaveRoom = async () => {
   try {
     if (roomId) {
       //서버에 방 나가기를 요청하는 코드
       await roomApi.deleteRoom(roomId);
       navigate('/game-lobby');//로비 페이지로 이동
     }
   } catch (error) {
     console.error('Failed to leave room:', error);
   }
 };

 //메시지 전송하는 코드
 const handleSendMessage = (e: React.FormEvent) => {
   e.preventDefault();//페이지 새로고침을 방지함
   //메시지가 비어있거나 방 번호 없으면 멈춤
   if (!newMessage.trim() || !roomId) return;

   sendChatMessage(roomId, newMessage);//서버에 메시지를 전송
   setMessages(prev => [...prev, {//로컬 메시지 목록에 새 메시지 추가
     id: Date.now().toString(),//고유 id 생성함
     senderName: '나',//보낸 사람 이름
     content: newMessage,//메시지 내용
     timestamp: new Date().toISOString()//보낸 시간
   }]);
   //입력창 비움
   setNewMessage('');
 };

 return (
   <div className="h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("/images/splash_background.jpg")' }}>
     <div className="absolute inset-0 bg-black bg-opacity-70"></div>
     
     <div className="relative h-full z-10 p-4">
       <GameHeader 
         roomId={roomId || ''} 
         gameState={gameState} 
         onLeave={handleLeaveRoom}
       />

       <div className="flex h-full gap-4 pt-16">
         <div className="flex-1">
           <div className="w-full h-full bg-gray-900 bg-opacity-80 rounded-lg border border-gray-800">
             {gameState ? (
               <div className="relative h-full">
                 <div className="absolute inset-0">
                   {/* 게더타운 컴포넌트 */}
                 </div>
                 <GameStatus gameState={gameState} />
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

         <ChatWindow 
           messages={messages}
           newMessage={newMessage}
           onMessageChange={setNewMessage}
           onSendMessage={handleSendMessage}
         />
       </div>
     </div>
   </div>
 );
};

export default GameRoom;