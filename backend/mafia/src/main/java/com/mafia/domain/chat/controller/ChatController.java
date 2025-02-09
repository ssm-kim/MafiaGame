package com.mafia.domain.chat.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mafia.domain.chat.model.StompPrincipal;
import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.GetMessageRequest;
import com.mafia.domain.chat.service.ChatService;
import com.mafia.global.common.model.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
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
@Tag(name = "채팅 API", description = "게임 내 채팅 관련 API")
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat/send")
    @Operation(summary = "채팅 메시지 전송", description = "STOMP를 통해 특정 채널에 채팅 메시지를 전송합니다.")
    public ResponseEntity<BaseResponse<Void>> sendMessage(@Parameter(description = "채팅 메시지 객체") ChatMessage message,
        @AuthenticationPrincipal @Parameter(hidden = true) StompPrincipal detail
    ) throws JsonProcessingException {
        chatService.sendMessage(message, Long.valueOf(detail.getName()));
        return ResponseEntity.ok(new BaseResponse<>());
    }


    @GetMapping("/chat")
    @Operation(summary = "최근 채팅 메시지 조회", description = "특정 게임 채널의 최근 채팅 메시지를 조회합니다.")
    public ResponseEntity<BaseResponse<List<ChatMessage>>> getRecentMessages(
        @Parameter(description = "조회할 게임 ID와 타입") GetMessageRequest req,
        @RequestParam @Parameter(description = "최근 메시지 개수") int count, @AuthenticationPrincipal @Parameter(hidden = true) StompPrincipal detail) {
        return ResponseEntity.ok(new BaseResponse<>(chatService.getRecentMessages(req, count, Long.valueOf(detail.getName()))));
    }
}
