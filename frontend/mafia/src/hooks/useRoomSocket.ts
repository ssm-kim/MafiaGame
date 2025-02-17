import { CompatClient } from '@stomp/stompjs';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const useRoom = (stompClient: React.MutableRefObject<CompatClient | null>, roomId: number) => {
  const navigate = useNavigate();

  const isGameStateChanged = (message) => {
    return 'gameStart' in message && message.gameStart === 'true';
  };

  const isHostLeft = (message) => {
    let result = true;

    Object.values(message).forEach((participantInfo) => {
      if (participantInfo.participantNo === 1) {
        result = false;
      }
    });

    return result;
  };

  const isBanned = (nickname, message) => {
    const myInfo = Object.values(message).find((p) => p.nickname === nickname);

    return myInfo === undefined;
  };

  const subscribeRoom = (
    nickname,
    onReceiveMessage: (message, gameStateChanged: boolean) => void,
  ) => {
    stompClient.current?.subscribe(`/topic/room/${roomId}`, (message) => {
      const data = JSON.parse(message.body);

      if (isGameStateChanged(data)) {
        onReceiveMessage(data, true);
        return;
      }

      if (isHostLeft(data)) {
        alert('방이 삭제되었습니다.');
        navigate('/game-lobby');
        return;
      }

      if (isBanned(nickname, data)) {
        alert('강제 퇴장 당하였습니다.');
        navigate('/game-lobby');
        return;
      }

      onReceiveMessage(data, false);
    });
  };

  const enterRoom = (password?: string) => {
    const data = { password: password || null };

    stompClient.current?.send(`/app/room/enter/${roomId}`, {}, JSON.stringify(data));
  };

  return {
    subscribeRoom,
    enterRoom,
  };
};

export default useRoom;
