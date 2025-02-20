package com.mafia.domain.chat.model.enumerate;

public enum ChatType {
    ROOM, DAY, NIGHT, DEAD;

    @Override
    public String toString() {
        return name().toLowerCase();
    }
}
