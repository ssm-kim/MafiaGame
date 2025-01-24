import { ChatMessage } from '../../types/chat';

interface ChatWindowProps {
    messages: ChatMessage[];
    newMessage: string;
    onMessageChange: (message: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
   }
   
   export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    newMessage,
    onMessageChange,
    onSendMessage
   }) => (
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
   
      <form onSubmit={onSendMessage} className="p-4 border-t border-gray-800">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="메시지 입력..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </form>
    </div>
   );