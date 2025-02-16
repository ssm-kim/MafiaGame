/* eslint-disable react/require-default-props */
/* eslint-disable react/require-default-props */
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

interface ChatWindowProps {
  messages: ChatMessage[];
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  chatType?: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';
  currentNickname: string; // 현재 사용자의 닉네임 prop 추가
}

function ChatWindow({
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  chatType = 'ROOM',
  currentNickname,
}: ChatWindowProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getChatTitle = () => {
    switch (chatType) {
      case 'DAY':
        return '낮 시간 - 전체 채팅';
      case 'NIGHT':
        return '밤 시간 - 팀 채팅';
      case 'DEAD':
        return '사망자 채팅';
      case 'SYSTEM':
        return '시스템 알림';
      default:
        return '비상 통신망';
    }
  };

  const getPlaceholderText = () => {
    switch (chatType) {
      case 'DEAD':
        return '사망자만 볼 수 있는 메시지...';
      case 'NIGHT':
        return '팀원들만 볼 수 있는 메시지...';
      default:
        return '메시지 입력...';
    }
  };

  const getMessageStyle = (msg: ChatMessage) => {
    if (msg.senderName === 'SYSTEM') {
      return 'bg-red-900 bg-opacity-50 text-center mx-2';
    }
    return msg.senderName === currentNickname
      ? 'bg-red-500 bg-opacity-30 ml-auto mr-2 max-w-[80%]'
      : 'bg-gray-800 bg-opacity-50 mr-auto ml-2 max-w-[80%]';
  };

  const getMessageTextStyle = (msg: ChatMessage) => {
    if (msg.senderName === 'SYSTEM') return 'text-red-300';
    if (msg.senderName === currentNickname) return 'text-white';
    return 'text-gray-100';
  };

  const getTimestampStyle = (msg: ChatMessage) => {
    return msg.senderName === currentNickname ? 'text-right' : 'text-left';
  };

  const filteredMessages = messages.filter((msg) => {
    if (chatType === 'ROOM') {
      return msg.type === 'ROOM';
    }
    if (chatType === 'DAY') {
      return msg.type === 'DAY' || msg.type === 'SYSTEM';
    }
    if (chatType === 'NIGHT') {
      return msg.type === 'NIGHT' || msg.type === 'SYSTEM';
    }
    if (chatType === 'DEAD') {
      return msg.type === 'DEAD' || msg.type === 'SYSTEM';
    }
    if (chatType === 'SYSTEM') {
      return msg.type === 'SYSTEM';
    }
    return true;
  });

  return (
    <div className="w-80 flex flex-col bg-gray-900 bg-opacity-90 rounded-lg border border-gray-800">
      <div className="p-3 border-b border-gray-800">
        <h3
          className="text-red-500"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          {getChatTitle()}
        </h3>
      </div>

      <div
        className="flex-1 p-4 overflow-y-auto custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(75, 85, 99, 0.3) transparent',
          msOverflowStyle: 'none',
        }}
      >
        <div className="space-y-2">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`break-words p-2 rounded flex flex-col ${getMessageStyle(msg)}`}
            >
              {msg.senderName !== 'SYSTEM' && (
                <span
                  className={`font-bold ${
                    msg.senderName === currentNickname ? 'text-red-300' : 'text-gray-300'
                  }`}
                >
                  {msg.senderName === currentNickname ? '나' : msg.senderName}:
                </span>
              )}
              <span className={getMessageTextStyle(msg)}>{msg.content}</span>
              <div className={`text-xs text-gray-500 mt-1 ${getTimestampStyle(msg)}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={onSendMessage}
        className="p-4 border-t border-gray-800"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={getPlaceholderText()}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                    text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={chatType === 'SYSTEM'}
        />
      </form>
    </div>
  );
}

export default ChatWindow;
// import React, { useRef, useEffect } from 'react';
// import { ChatMessage } from '@/types/chat';

// interface ChatWindowProps {
//   messages: ChatMessage[];
//   newMessage: string;
//   onMessageChange: (message: string) => void;
//   onSendMessage: (e: React.FormEvent) => void;
//   chatType?: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';
// }

// function ChatWindow({
//   messages,
//   newMessage,
//   onMessageChange,
//   onSendMessage,
//   chatType = 'ROOM',
// }: ChatWindowProps): JSX.Element {
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const getChatTitle = () => {
//     switch (chatType) {
//       case 'DAY':
//         return '낮 시간 - 전체 채팅';
//       case 'NIGHT':
//         return '밤 시간 - 팀 채팅';
//       case 'DEAD':
//         return '사망자 채팅';
//       case 'SYSTEM':
//         return '시스템 알림';
//       default:
//         return '비상 통신망';
//     }
//   };

//   const getPlaceholderText = () => {
//     switch (chatType) {
//       case 'DEAD':
//         return '사망자만 볼 수 있는 메시지...';
//       case 'NIGHT':
//         return '팀원들만 볼 수 있는 메시지...';
//       default:
//         return '메시지 입력...';
//     }
//   };

//   const getMessageStyle = (msg: ChatMessage) => {
//     if (msg.senderName === 'SYSTEM') {
//       return 'bg-red-900 bg-opacity-50 text-center mx-2';
//     }
//     return msg.senderName === '나'
//       ? 'bg-red-900 bg-opacity-30 ml-4'
//       : 'bg-gray-800 bg-opacity-50 mr-4';
//   };

//   const filteredMessages = messages.filter((msg) => {
//     if (chatType === 'ROOM') {
//       return msg.type === 'ROOM';
//     }
//     if (chatType === 'DAY') {
//       return msg.type === 'DAY' || msg.type === 'SYSTEM';
//     }
//     if (chatType === 'NIGHT') {
//       return msg.type === 'NIGHT' || msg.type === 'SYSTEM';
//     }
//     if (chatType === 'DEAD') {
//       return msg.type === 'DEAD' || msg.type === 'SYSTEM';
//     }
//     if (chatType === 'SYSTEM') {
//       return msg.type === 'SYSTEM';
//     }
//     return true;
//   });

//   return (
//     <div className="w-80 flex flex-col bg-gray-900 bg-opacity-90 rounded-lg border border-gray-800">
//       <div className="p-3 border-b border-gray-800">
//         <h3
//           className="text-red-500"
//           style={{ fontFamily: 'BMEuljiro10yearslater' }}
//         >
//           {getChatTitle()}
//         </h3>
//       </div>

//       <div
//         className="flex-1 p-4 overflow-y-auto custom-scrollbar"
//         style={{
//           scrollbarWidth: 'thin',
//           scrollbarColor: 'rgba(75, 85, 99, 0.3) transparent',
//           msOverflowStyle: 'none',
//         }}
//       >
//         <div className="space-y-2">
//           {filteredMessages.map((msg) => (
//             <div
//               key={msg.id}
//               className={`break-words p-2 rounded ${getMessageStyle(msg)}`}
//             >
//               {msg.senderName !== 'SYSTEM' && (
//                 <span className="font-bold text-gray-300">{msg.senderName}: </span>
//               )}
//               <span className={msg.senderName === 'SYSTEM' ? 'text-red-300' : 'text-gray-100'}>
//                 {msg.content}
//               </span>
//               <div className="text-xs text-gray-500 mt-1">
//                 {new Date(msg.timestamp).toLocaleTimeString()}
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>
//       </div>

//       <form
//         onSubmit={onSendMessage}
//         className="p-4 border-t border-gray-800"
//       >
//         <input
//           type="text"
//           value={newMessage}
//           onChange={(e) => onMessageChange(e.target.value)}
//           placeholder={getPlaceholderText()}
//           className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
//                     text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
//           disabled={chatType === 'SYSTEM'}
//         />
//       </form>
//     </div>
//   );
// }

// export default ChatWindow;
