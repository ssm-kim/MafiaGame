package com.mafia.domain.game.event;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class GameEventSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    public GameEventSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String msg = new String(message.getBody());
        String channel = new String(pattern);

        if (channel.equals("game-phase")) {
            messagingTemplate.convertAndSend("/topic/game-phase", msg);
        } else if (channel.equals("vote-result")) {
            messagingTemplate.convertAndSend("/topic/vote-result", msg);
        } else if (channel.equals("round-result")) {
            messagingTemplate.convertAndSend("/topic/round-result", msg);
        }
    }
}

