package com.mafia.domain.chat.model.enumerate;

import lombok.Getter;

@Getter
public enum ChatRoomType {
    DAY_CHAT("day"),
    MAFIA_CHAT("mafia"),
    DEAD_CHAT("dead");

    private final String prefix;

    ChatRoomType(String prefix) {
        this.prefix = prefix;
    }
}
