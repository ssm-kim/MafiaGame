package com.mafia.domain.chat.model.dto;

import com.mafia.domain.chat.model.enumerate.ChatType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "채팅 메시지 요청 DTO")
public class GetMessageRequest {

    @Schema(description = "게임 ID", example = "12345")
    private long gameId;

    @Schema(description = "채팅 타입 (room, day, night, dead)", example = "room")
    private ChatType chatType;
}
