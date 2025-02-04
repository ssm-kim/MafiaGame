import React, { useState, useEffect } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const ChatTest = () => {
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatType, setChatType] = useState("DAY");

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new SockJS('http://localhost:8081/mafia-chat-ws');
      const stomp = Stomp.over(socket);

      stomp.connect({}, () => {
        console.log("✅ WebSocket 연결 성공!");

        stomp.subscribe("/topic/day-chat", (msg) => handleMessage("DAY", msg.body));
        stomp.subscribe("/topic/night-chat", (msg) => handleMessage("NIGHT", msg.body));
        stomp.subscribe("/topic/dead-chat", (msg) => handleMessage("DEAD", msg.body));

        setStompClient(stomp);
      });

      stomp.onclose = () => {
        console.log("❌ WebSocket 연결 끊김! 3초 후 재연결...");
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (stompClient) {
        stompClient.disconnect();
        console.log("❌ WebSocket 연결 종료");
      }
    };
  }, []);

  const handleMessage = (type, msg) => {
    setMessages((prev) => [...prev, { type, content: msg }]);
  };

  const sendMessage = () => {
    if (stompClient && message.trim() !== "") {
      stompClient.send("/app/send", {}, JSON.stringify({
        gameId: 1,
        content: message,
        chatType: chatType,
      }));
      setMessage("");
    }
  };

  return (
    <div>
      <h2>WebSocket 채팅 테스트</h2>
      <div>{messages.map((msg, index) => <div key={index}>[{msg.type}] {msg.content}</div>)}</div>
      <select value={chatType} onChange={(e) => setChatType(e.target.value)}>
        <option value="DAY">낮 채팅</option>
        <option value="NIGHT">밤 채팅</option>
        <option value="DEAD">죽은 채팅</option>
      </select>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
};

export default ChatTest;
