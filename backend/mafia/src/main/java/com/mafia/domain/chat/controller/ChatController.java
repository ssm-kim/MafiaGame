package com.mafia.domain.chat.controller;

import com.mafia.domain.chat.model.StompPrincipal;
import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.GetMessageRequest;
import com.mafia.domain.chat.service.ChatService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

    /*
    TODO:
     1. 채팅방 생성은 방생성될 때, 동시에 보낼 수 있도록 한다.
     2. 채팅방 전체 조회는 마피아,시민 전용채팅으로 사용할 기능으로 한다.
     3. 게임방이 삭제될 때, 채팅방도 같이 삭제되어야한다.
     4. 예외 처리
     */

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * STOMP를 통한 채팅 메시지 처리
     */
    @MessageMapping("/chat/send")
    public void sendMessage(@Payload ChatMessage message, @AuthenticationPrincipal StompPrincipal detail) {
        chatService.sendMessage(message, Long.valueOf(detail.getName()));
    }

    /**
     * 특정 채팅 채널의 최근 채팅 기록 가져오기
     */
    @GetMapping("/chat")
    public List<ChatMessage> getRecentMessages(
        GetMessageRequest req,
        @RequestParam int count, @AuthenticationPrincipal StompPrincipal detail) {
        return chatService.getRecentMessages(req, count, Long.valueOf(detail.getName()));
    }
}
