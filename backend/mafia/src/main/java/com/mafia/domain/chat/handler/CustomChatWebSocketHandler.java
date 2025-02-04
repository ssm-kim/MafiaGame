package com.mafia.domain.chat.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.ChatRoom;
import com.mafia.domain.chat.model.enumerate.MessageType;
import com.mafia.domain.chat.service.ChatService;
import java.io.IOException;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatService chatService;
    private final ObjectMapper objectMapper = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String clientAddress = session.getRemoteAddress().toString();
        log.info("새로운 클라이언트 연결됨: ID={}, Address={}", session.getId(), clientAddress);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String clientAddress = session.getRemoteAddress().toString();
        try {
            String payload = message.getPayload();
            JsonNode jsonNode = objectMapper.readTree(payload);

            MessageType type = MessageType.valueOf(jsonNode.get("type").asText());
            String chatRoomId = jsonNode.get("chatRoomId").asText();
            ChatRoom room = chatService.findRoomById(chatRoomId);

            if (room == null) {
                log.error("존재하지 않는 채팅방: roomId={}, client={}", chatRoomId, clientAddress);
                return;
            }

            switch (type) {
                case JOIN -> handleJoin(session, room, jsonNode);
                case TALK -> handleTalk(room, jsonNode);
                case LEAVE -> handleLeave(session, room, jsonNode);
            }

        } catch (Exception e) {
            log.error("메시지 처리 중 오류 발생: client={}, message={}",
                clientAddress, message.getPayload(), e);
        }
    }

    // 채팅 권한 체크 로직 추가  ->  원본
    private boolean canChat(ChatRoom room, String sender) {
        // 원본
//        GamePhase currentPhase = gameService.getPhase(room.getRoomId());
//        Game game = gameService.findById(room.getRoomId());
//
//        return switch (room.getType()) {
//            case DAY_CHAT -> currentPhase == GamePhase.DAY_DISCUSSION
//                && !game.getPlayers().get(sender).isDead();
//            case MAFIA_CHAT -> currentPhase == GamePhase.NIGHT_ACTION
//                && game.getPlayers().get(sender).getRole() == Role.ZOMBIE;
//            case DEAD_CHAT -> game.getPlayers().get(sender).isDead();
//        };
        // 테스트
        return switch (room.getType()) {
            case DAY_CHAT -> true;  // 낮 채팅은 모두 가능
            case MAFIA_CHAT -> true;  // 테스트를 위해 마피아 채팅도 모두 가능
            case DEAD_CHAT -> true;  // 테스트를 위해 사망자 채팅도 모두 가능
            default -> false;
        };
    }

    private void handleJoin(WebSocketSession session, ChatRoom room, JsonNode jsonNode)
        throws IOException {
        // 세션 추가 전 로그
        log.info("JOIN 시도: roomId={}, sessionId={}, 추가 전 세션 수={}",
            room.getChatRoomId(), session.getId(), room.getSessions().size());

        // 세션 추가
        room.getSessions().add(session);

        // 세션 추가 후 로그
        log.info("JOIN 완료: roomId={}, sessionId={}, 추가 후 세션 수={}",
            room.getChatRoomId(), session.getId(), room.getSessions().size());

        ChatMessage joinMessage = ChatMessage.systemMessage(
            room.getChatRoomId(),
            jsonNode.get("sender").asText() + "님이 입장하셨습니다."
        );
        sendMessage(room, joinMessage);
    }

    private void handleTalk(ChatRoom room, JsonNode jsonNode) throws IOException {
        ChatMessage chatMessage = new ChatMessage(
            room.getChatRoomId(),
            MessageType.TALK,
            jsonNode.get("sender").asText(),
            jsonNode.get("content").asText(),
            LocalDateTime.now()
        );
        sendMessage(room, chatMessage);
    }

    private void handleLeave(WebSocketSession session, ChatRoom room, JsonNode jsonNode)
        throws IOException {
        room.getSessions().remove(session);
        log.info("채팅방 퇴장: roomId={}, session={}", room.getChatRoomId(), session.getId());

        ChatMessage leaveMessage = ChatMessage.systemMessage(
            room.getChatRoomId(),
            jsonNode.get("sender").asText() + "님이 퇴장하셨습니다."
        );
        sendMessage(room, leaveMessage);
    }

    private void sendMessage(ChatRoom room, ChatMessage message) throws IOException {
        TextMessage textMessage = new TextMessage(objectMapper.writeValueAsString(message));
        log.info("메시지 전송: roomId={}, 세션 수={}",
            room.getChatRoomId(), room.getSessions().size());

        for (WebSocketSession sess : room.getSessions()) {
            if (sess.isOpen()) {
                sess.sendMessage(textMessage);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String clientAddress = session.getRemoteAddress().toString();
        log.info("클라이언트 연결 해제됨: ID={}, Address={}", session.getId(), clientAddress);

        // 모든 채팅방에서 해당 세션 제거
        chatService.getAllRooms().values().forEach(room -> {
            room.getSessions().remove(session);
        });
    }
}