// /* eslint-disable react/require-default-props */
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
//         className="flex-1 p-4 overflow-y-auto"
//         style={{
//           scrollbarWidth: 'thin',
//           scrollbarColor: 'rgba(75, 85, 99, 0.3) transparent',
//           msOverflowStyle: 'none',
//           WebkitScrollbarWidth: '8px',
//           WebkitScrollbarTrack: {
//             background: 'transparent',
//           },
//           WebkitScrollbarThumb: {
//             background: 'rgba(75, 85, 99, 0.3)',
//             borderRadius: '4px',
//           },
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
// // import React from 'react';
// // import { ChatMessage } from '@/types/chat';

// // interface ChatWindowProps {
// //   messages: ChatMessage[];
// //   newMessage: string;
// //   onMessageChange: (message: string) => void;
// //   onSendMessage: (e: React.FormEvent) => void;
// // }

// // function ChatWindow({
// //   messages,
// //   newMessage,
// //   onMessageChange,
// //   onSendMessage,
// // }: ChatWindowProps): JSX.Element {
// //   return (
// //     <div className="w-80 flex flex-col bg-gray-900 bg-opacity-90 rounded-lg border border-gray-800">
// //       <div className="p-3 border-b border-gray-800">
// //         <h3
// //           className="text-red-500"
// //           style={{ fontFamily: 'BMEuljiro10yearslater' }}
// //         >
// //           비상 통신망
// //         </h3>
// //       </div>

// //       <div className="flex-1 p-4 overflow-y-auto">
// //         <div className="space-y-2">
// //           {messages.map((msg) => (
// //             <div
// //               key={msg.id}
// //               className={`break-words p-2 rounded ${
// //                 msg.senderName === '나'
// //                   ? 'bg-red-900 bg-opacity-30 ml-4'
// //                   : 'bg-gray-800 bg-opacity-50 mr-4'
// //               }`}
// //             >
// //               <span className="font-bold text-gray-300">{msg.senderName}: </span>
// //               <span className="text-gray-100">{msg.content}</span>
// //               <div className="text-xs text-gray-500 mt-1">
// //                 {new Date(msg.timestamp).toLocaleTimeString()}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       <form
// //         onSubmit={onSendMessage}
// //         className="p-4 border-t border-gray-800"
// //       >
// //         <input
// //           type="text"
// //           value={newMessage}
// //           onChange={(e) => onMessageChange(e.target.value)}
// //           placeholder="메시지 입력..."
// //           className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
// //         />
// //       </form>
// //     </div>
// //   );
// // }

// // export default ChatWindow;

// // import React, { useRef, useEffect } from 'react';
// // import { ChatMessage } from '@/types/chat';

// // interface ChatWindowProps {
// //   messages: ChatMessage[];
// //   newMessage: string;
// //   onMessageChange: (message: string) => void;
// //   onSendMessage: (e: React.FormEvent) => void;
// //   chatType?: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM'; // 채팅 타입 추가
// // }

// // function ChatWindow({
// //   messages,
// //   newMessage,
// //   onMessageChange,
// //   onSendMessage,
// //   chatType = 'ROOM', // 기본값은 ROOM
// // }: ChatWindowProps): JSX.Element {
// //   // 메시지 창 자동 스크롤을 위한 ref
// //   const messagesEndRef = useRef<HTMLDivElement>(null);

// //   // 새 메시지가 올 때마다 스크롤 아래로 이동
// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// //   }, [messages]);

// //   // 채팅 타입에 따른 제목 설정
// //   const getChatTitle = () => {
// //     switch (chatType) {
// //       case 'DAY':
// //         return '낮 시간 - 전체 채팅';
// //       case 'NIGHT':
// //         return '밤 시간 - 팀 채팅';
// //       case 'DEAD':
// //         return '사망자 채팅';
// //       case 'SYSTEM':
// //         return '시스템 알림';
// //       default:
// //         return '비상 통신망';
// //     }
// //   };

// //   // 메시지 스타일 결정
// //   const getMessageStyle = (msg: ChatMessage) => {
// //     if (msg.senderName === 'SYSTEM') {
// //       return 'bg-red-900 bg-opacity-50 text-center mx-2';
// //     }
// //     return msg.senderName === '나'
// //       ? 'bg-red-900 bg-opacity-30 ml-4'
// //       : 'bg-gray-800 bg-opacity-50 mr-4';
// //   };

// //   return (
// //     <div className="w-80 flex flex-col bg-gray-900 bg-opacity-90 rounded-lg border border-gray-800">
// //       {/* 채팅창 헤더 */}
// //       <div className="p-3 border-b border-gray-800">
// //         <h3
// //           className="text-red-500"
// //           style={{ fontFamily: 'BMEuljiro10yearslater' }}
// //         >
// //           {getChatTitle()}
// //         </h3>
// //       </div>

// //       {/* 메시지 표시 영역 */}
// //       <div className="flex-1 p-4 overflow-y-auto">
// //         <div className="space-y-2">
// //           {messages.map((msg) => (
// //             <div
// //               key={msg.id}
// //               className={`break-words p-2 rounded ${getMessageStyle(msg)}`}
// //             >
// //               {msg.senderName !== 'SYSTEM' && (
// //                 <span className="font-bold text-gray-300">{msg.senderName}: </span>
// //               )}
// //               <span className={`${msg.senderName === 'SYSTEM' ? 'text-red-300' : 'text-gray-100'}`}>
// //                 {msg.content}
// //               </span>
// //               <div className="text-xs text-gray-500 mt-1">
// //                 {new Date(msg.timestamp).toLocaleTimeString()}
// //               </div>
// //             </div>
// //           ))}
// //           <div ref={messagesEndRef} />
// //         </div>
// //       </div>

// //       {/* 메시지 입력 폼 */}
// //       <form
// //         onSubmit={onSendMessage}
// //         className="p-4 border-t border-gray-800"
// //       >
// //         <input
// //           type="text"
// //           value={newMessage}
// //           onChange={(e) => onMessageChange(e.target.value)}
// //           placeholder={chatType === 'DEAD' ? '사망자만 볼 수 있는 메시지...' : '메시지 입력...'}
// //           className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
// //                    text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
// //           disabled={chatType === 'SYSTEM'} // 시스템 채팅일 때는 입력 불가
// //         />
// //       </form>
// //     </div>
// //   );
// // }

// // export default ChatWindow;

// // import React, { useRef, useEffect } from 'react';
// // import { ChatMessage } from '@/types/chat';

// // interface ChatWindowProps {
// //   messages: ChatMessage[];
// //   newMessage: string;
// //   onMessageChange: (message: string) => void;
// //   onSendMessage: (e: React.FormEvent) => void;
// //   chatType?: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM'; // 채팅 타입 추가
// // }

// // function ChatWindow({
// //   messages,
// //   newMessage,
// //   onMessageChange,
// //   onSendMessage,
// //   chatType = 'ROOM', // 기본값은 ROOM
// // }: ChatWindowProps): JSX.Element {
// //   // 메시지 창 자동 스크롤을 위한 ref
// //   const messagesEndRef = useRef<HTMLDivElement>(null);

// //   // 새 메시지가 올 때마다 스크롤 아래로 이동
// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// //   }, [messages]);

// //   // 채팅 타입에 따른 제목 설정
// //   const getChatTitle = () => {
// //     switch (chatType) {
// //       case 'DAY':
// //         return '낮 시간 - 전체 채팅';
// //       case 'NIGHT':
// //         return '밤 시간 - 팀 채팅';
// //       case 'DEAD':
// //         return '사망자 채팅';
// //       case 'SYSTEM':
// //         return '시스템 알림';
// //       default:
// //         return '비상 통신망';
// //     }
// //   };

// //   // 메시지 스타일 결정
// //   const getMessageStyle = (msg: ChatMessage) => {
// //     if (msg.senderName === 'SYSTEM') {
// //       return 'bg-red-900 bg-opacity-50 text-center mx-2';
// //     }
// //     return msg.senderName === '나'
// //       ? 'bg-red-900 bg-opacity-30 ml-4'
// //       : 'bg-gray-800 bg-opacity-50 mr-4';
// //   };

// //   return (
// //     <div className="w-80 flex flex-col bg-gray-900 bg-opacity-90 rounded-lg border border-gray-800">
// //       {/* 채팅창 헤더 */}
// //       <div className="p-3 border-b border-gray-800">
// //         <h3
// //           className="text-red-500"
// //           style={{ fontFamily: 'BMEuljiro10yearslater' }}
// //         >
// //           {getChatTitle()}
// //         </h3>
// //       </div>

// //       {/* 메시지 표시 영역 */}
// //       <div
// //         className="flex-1 p-4 overflow-y-auto"
// //         style={{
// //           scrollbarWidth: 'thin',
// //           scrollbarColor: 'rgba(75, 85, 99, 0.3) transparent',
// //           msOverflowStyle: 'none',
// //           WebkitScrollbarWidth: '8px',
// //           WebkitScrollbarTrack: {
// //             background: 'transparent',
// //           },
// //           WebkitScrollbarThumb: {
// //             background: 'rgba(75, 85, 99, 0.3)',
// //             borderRadius: '4px',
// //           },
// //         }}
// //       >
// //         <div className="space-y-2">
// //           {messages.map((msg) => (
// //             <div
// //               key={msg.id}
// //               className={`break-words p-2 rounded ${getMessageStyle(msg)}`}
// //             >
// //               {msg.senderName !== 'SYSTEM' && (
// //                 <span className="font-bold text-gray-300">{msg.senderName}: </span>
// //               )}
// //               <span className={`${msg.senderName === 'SYSTEM' ? 'text-red-300' : 'text-gray-100'}`}>
// //                 {msg.content}
// //               </span>
// //               <div className="text-xs text-gray-500 mt-1">
// //                 {new Date(msg.timestamp).toLocaleTimeString()}
// //               </div>
// //             </div>
// //           ))}
// //           <div ref={messagesEndRef} />
// //         </div>
// //       </div>

// //       {/* 메시지 입력 폼 */}
// //       <form
// //         onSubmit={onSendMessage}
// //         className="p-4 border-t border-gray-800"
// //       >
// //         <input
// //           type="text"
// //           value={newMessage}
// //           onChange={(e) => onMessageChange(e.target.value)}
// //           placeholder={chatType === 'DEAD' ? '사망자만 볼 수 있는 메시지...' : '메시지 입력...'}
// //           className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
// //                   text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
// //           disabled={chatType === 'SYSTEM'} // 시스템 채팅일 때는 입력 불가
// //         />
// //       </form>
// //     </div>
// //   );
// // }

// // export default ChatWindow;

/* eslint-disable react/require-default-props */
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

interface ChatWindowProps {
  messages: ChatMessage[];
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  chatType?: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';
}

function ChatWindow({
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  chatType = 'ROOM',
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
    return msg.senderName === '나'
      ? 'bg-red-900 bg-opacity-30 ml-4'
      : 'bg-gray-800 bg-opacity-50 mr-4';
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
              className={`break-words p-2 rounded ${getMessageStyle(msg)}`}
            >
              {msg.senderName !== 'SYSTEM' && (
                <span className="font-bold text-gray-300">{msg.senderName}: </span>
              )}
              <span className={msg.senderName === 'SYSTEM' ? 'text-red-300' : 'text-gray-100'}>
                {msg.content}
              </span>
              <div className="text-xs text-gray-500 mt-1">
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
