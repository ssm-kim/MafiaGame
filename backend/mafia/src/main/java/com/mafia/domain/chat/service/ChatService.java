package com.mafia.domain.chat.service;

import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.repository.ChatRepository;
import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.service.GameService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatPublisher chatPublisher;
    private final ChatRepository chatRepository;
    private final GameService gameService;

    /**
     * 채팅 메시지 처리 및 전송
     */
    public void processChatMessage(ChatMessage message) {
        long gameId = message.getGameId();
        int playerNo = message.getPlayerNo();

        // 🔹 플레이어 정보 가져오기
        Player player = gameService.findPlayerByNo(gameId, playerNo);
        String chatContent = "[" + player.getNickname() + "] " + message.getContent();

        log.info("Processing chat message: gameId={}, playerNo={}, chatType={}, content={}",
            gameId, playerNo, message.getChatType(), chatContent);

        // 🔥 채팅 권한 확인 후 메시지 저장 & 전송
        switch (message.getChatType()) {
            case DAY:
                chatRepository.saveMessage(String.valueOf(gameId), "day-chat", message);
                chatPublisher.publish("day-chat", chatContent);
                log.info("Published to Redis: day-chat -> {}", chatContent);
                break;
            case NIGHT:
                chatRepository.saveMessage(String.valueOf(gameId), "night-chat", message);
                chatPublisher.publish("night-chat", chatContent);
                log.info("Published to Redis: night-chat -> {}", chatContent);
                break;
            case DEAD:
                chatRepository.saveMessage(String.valueOf(gameId), "dead-chat", message);
                chatPublisher.publish("dead-chat", chatContent);
                log.info("Published to Redis: dead-chat -> {}", chatContent);
                break;
        }
    }

    /**
     * 특정 채팅 채널의 최근 메시지 가져오기
     */
    public List<ChatMessage> getRecentMessages(long gameId, String chatType, int count) {
        return chatRepository.getRecentMessages(String.valueOf(gameId), chatType, count);
    }
}