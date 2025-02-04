package com.mafia.domain.chat.service;

import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.GetMessageRequest;
import com.mafia.domain.chat.model.enumerate.ChatType;
import com.mafia.domain.chat.repository.ChatRepository;
import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.model.game.Role;
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
        ChatType type = message.getChatType();

        log.info("📩 Client Message Received: channel={}, message={}", type, message.getContent());

        // 🔹 플레이어 정보 가져오기
        Player player = gameService.findPlayerByNo(gameId, playerNo);
        String chatContent = "[" + player.getNickname() + "] " + message.getContent();

        // 🔥 채팅 권한 확인 후 메시지 저장 & 전송
        String channel;
        switch (type) {
            case DAY -> channel = "day-chat";
            case NIGHT -> channel = "night-chat";
            case DEAD -> channel = "dead-chat";
            default -> throw new IllegalArgumentException("Unknown chat type: " + message.getChatType());
        }
        chatRepository.saveMessage(String.valueOf(gameId), channel, message);
        chatPublisher.publish(channel, chatContent);
    }

    /**
     * 특정 채팅 채널의 최근 메시지 가져오기
     */
    public List<ChatMessage> getRecentMessages(GetMessageRequest req, int count) {
        long gameId = req.getGameId();
        int playerNo = req.getPlayerNo();
        ChatType type = req.getChatType();

        // 🔹 플레이어 정보 가져오기
        Player player = gameService.findPlayerByNo(gameId, playerNo);

        if (canAccessChannel(player, type)) {return chatRepository.getRecentMessages(String.valueOf(gameId), String.valueOf(type), count);}
        else {throw new IllegalArgumentException("해당 채팅방을 조회할 권한이 없습니다.");}
    }

    /**
     * 특정 채팅방에 접근 가능한지 여부를 판단
     */
    private boolean canAccessChannel(Player player, ChatType chatType) {
        if (player.isDead()) {
            return true; // 죽은 사람은 모든 채팅방 조회 가능
        }

        if (player.getRole() == Role.ZOMBIE) {
            return chatType == ChatType.DAY || chatType == ChatType.NIGHT; // 좀비는 DAY, NIGHT 조회 가능
        }

        return chatType == ChatType.DAY; // 좀비가 아닌 플레이어는 DAY만 조회 가능
    }
}