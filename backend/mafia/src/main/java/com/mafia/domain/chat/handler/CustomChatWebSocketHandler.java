package com.mafia.domain.chat.handler;

import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.ChatRoom;
import com.mafia.domain.chat.model.enumerate.MessageType;
import com.mafia.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.LocalDateTime;

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
    protected void handleTextMessage(WebSocketSession session, TextMessage message)
        throws Exception {
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

    private void handleJoin(WebSocketSession session, ChatRoom room, JsonNode jsonNode)
        throws IOException {
        room.getSessions().add(session);
        log.info("채팅방 입장: roomId={}, session={}", room.getChatRoomId(), session.getId());

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