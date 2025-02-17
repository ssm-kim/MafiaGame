import React, { useState } from 'react';
import { CompatClient, StompSubscription, messageCallbackType } from '@stomp/stompjs';

export interface Topic {
  url: string;
  callback: messageCallbackType;
}

export type ChatType = 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';

const createNewMessage = (type: ChatType, message) => {
  const parsedMessage = JSON.parse(message.body);

  const newMessage = {
    id: parsedMessage.messageId || Date.now().toString(),
    content: parsedMessage.content,
    senderName: type === 'SYSTEM' ? 'SYSTEM' : parsedMessage.nickname || parsedMessage.sender,
    timestamp: parsedMessage.sendTime || parsedMessage.timestamp || new Date().toISOString(),
    type,
  };

  return newMessage;
};

const getCurrentChatType = (topic) => {
  if (topic.includes('day')) {
    return 'DAY';
  }

  if (topic.includes('night')) {
    return 'NIGHT';
  }

  if (topic.includes('dead')) {
    return 'DEAD';
  }

  return 'ROOM';
};

const useChatting = (stompClient: React.MutableRefObject<CompatClient | null>, roomId: number) => {
  const [subscriptions, setSubscriptions] = useState<StompSubscription[]>([]);
  const [chatType, setChatType] = useState<ChatType>('ROOM');

  const subscribeSystemChat = (onReceiveMessage: (message) => void) => {
    stompClient.current?.subscribe(`/topic/game-${roomId}-system`, (message) => {
      const data = JSON.parse(message.body);
      onReceiveMessage(data);

      if (data.phase && data.time) {
        if (chatType === 'DEAD') return;
        setChatType(data.phase === 'NIGHT_ACTION' ? 'NIGHT' : 'DAY');
      }
    });
  };

  const subscribeRoomChat = (onReceiveMessage: (newMessage) => void) => {
    stompClient.current?.subscribe(`/topic/room-${roomId}-chat`, (message) => {
      const newMessage = createNewMessage('ROOM', message);
      onReceiveMessage(newMessage);
    });
  };

  const subscribeTopics = (
    topics: string[],
    unsubscribeAll: boolean,
    onReceiveMessage: (newMessage) => void,
  ) => {
    if (unsubscribeAll) {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    const newSubscriptions = [];

    let currentChatType = chatType;

    topics.forEach((topic) => {
      currentChatType = getCurrentChatType(topic);

      // setChatType(currentChatType);

      const subscription = stompClient.current?.subscribe(`/topic/${topic}`, (message) => {
        const newMessage = createNewMessage(currentChatType, message);
        onReceiveMessage(newMessage);
      });

      newSubscriptions.push(subscription);
    });

    setSubscriptions(newSubscriptions);
  };

  const sendMessage = (message: string) => {
    const chatMessage = {
      gameId: roomId,
      content: message,
      chatType,
    };

    stompClient.current?.send(`/app/chat/send`, {}, JSON.stringify(chatMessage));
  };

  return {
    chatType,
    subscribeSystemChat,
    subscribeRoomChat,
    subscribeTopics,
    sendMessage,
  };
};

export default useChatting;
