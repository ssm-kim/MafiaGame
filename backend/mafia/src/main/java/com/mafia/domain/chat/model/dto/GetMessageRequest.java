package com.mafia.domain.chat.model.dto;

import com.mafia.domain.chat.model.enumerate.ChatType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GetMessageRequest {
    private long gameId;
    private int playerNo;
    private ChatType chatType;
}
