package com.mafia.domain.chat.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import org.springframework.web.socket.WebSocketSession;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Getter
public class ChatRoom {
    private String chatRoomId;

    @JsonIgnore
    private Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    // private 생성자로 직접 생성 방지
    private ChatRoom() {}

    public static ChatRoom create() {
        ChatRoom room = new ChatRoom();
        room.chatRoomId = java.util.UUID.randomUUID().toString();
        return room;
    }
}