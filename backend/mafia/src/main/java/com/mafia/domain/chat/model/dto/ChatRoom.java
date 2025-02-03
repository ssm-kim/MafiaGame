package com.mafia.domain.chat.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mafia.domain.chat.model.enumerate.ChatRoomType;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Getter;
import org.springframework.web.socket.WebSocketSession;

@Getter
public class ChatRoom {

    private String chatRoomId;
    private ChatRoomType type;
    private Long roomId;

    @JsonIgnore
    private Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    // private 생성자로 직접 생성 방지
    private ChatRoom() {

    }

    // 기존 create 메서드 유지
    public static ChatRoom create() {
        ChatRoom room = new ChatRoom();
        room.chatRoomId = UUID.randomUUID().toString();
        return room;
    }

    public static ChatRoom create(ChatRoomType type, Long roomId) {
        ChatRoom room = new ChatRoom();
        room.chatRoomId =
            type.getPrefix() + "_" + roomId + "_" + java.util.UUID.randomUUID().toString();
        room.type = type;
        room.roomId = roomId;
        return room;
    }
}