package com.mafia.domain.chat.model.dto;

import com.mafia.domain.chat.model.enumerate.ChatType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessage {

    private long gameId;
    private String content;
    private ChatType chatType;
}

