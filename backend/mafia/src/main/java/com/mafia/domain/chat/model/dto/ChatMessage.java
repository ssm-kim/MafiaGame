package com.mafia.domain.chat.model.dto;

import com.mafia.domain.chat.model.enumerate.MessageType;

import java.time.LocalDateTime;

public record ChatMessage(
        String chatRoomId,
        MessageType type,
        String sender,
        String content,
        LocalDateTime timestamp
)
{
    // 시스템 메시지 생성을 위한 팩토리 메서드
    public static ChatMessage systemMessage(String chatRoomId, String content) {
        return new ChatMessage(
                chatRoomId,
                MessageType.SYSTEM,
                "시스템",
                content,
                LocalDateTime.now()
        );
    }
}