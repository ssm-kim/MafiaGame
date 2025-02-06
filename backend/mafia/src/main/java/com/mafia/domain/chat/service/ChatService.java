package com.mafia.domain.chat.service;

import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.GetMessageRequest;
import com.mafia.domain.chat.model.enumerate.ChatType;
import com.mafia.domain.chat.repository.ChatRepository;
import com.mafia.domain.game.model.game.Game;
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
     * 플레이어가 메시지를 보내면 검증 후 저장 및 Redis Pub/Sub으로 전송
     */
    public void sendMessage(ChatMessage message, Long memberId) {
        long gameId = message.getGameId();
        String content = message.getContent();
        ChatType chatType = message.getChatType();

        Game game = gameService.findById(gameId);
        Player player = game.getPlayers().get(memberId);

        if (player == null) {
            throw new IllegalArgumentException("❌ 존재하지 않는 플레이어입니다.");
        }

        String topic = "game-" + gameId + "-" + chatType + "-chat"; // Redis Pub/Sub 채널

        // 🔥 플레이어가 해당 채널을 구독하고 있는지 확인
        if (!player.isSubscribed(topic)) {
            throw new IllegalArgumentException("❌ 플레이어 " + memberId + "는 " + chatType + " 채널에 메시지를 보낼 수 없습니다.");
        }

        chatRepository.saveMessage(message);
        // Redis Pub/Sub을 통해 메시지 전송
        chatPublisher.publish(topic, content);

        System.out.println("📨 플레이어 " + memberId + "가 " + chatType + " 채널에 메시지를 보냈습니다: " + content);
    }

    /**
     * 특정 채팅 채널의 최근 메시지 가져오기
     */
    public List<ChatMessage> getRecentMessages(GetMessageRequest req, int count, Long memberId) {
        long gameId = req.getGameId();
        ChatType type = req.getChatType();

        Game game = gameService.findById(gameId);
        Player player = game.getPlayers().get(memberId);

        if (player == null) {
            throw new IllegalArgumentException("❌ 존재하지 않는 플레이어입니다.");
        }

        String topic = "game-" + gameId + "-" + type + "-chat"; // Redis Pub/Sub 채널

        // 🔥 플레이어가 해당 채널을 구독하고 있는지 확인
        if (!player.isSubscribed(topic)) {
            throw new IllegalArgumentException("❌ 플레이어 " + memberId + "는 " + topic + " 채널에 메시지를 보낼 수 없습니다.");
        }

        return chatRepository.getRecentMessages(String.valueOf(gameId), String.valueOf(type), count);
    }
}