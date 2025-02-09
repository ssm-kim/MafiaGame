package com.mafia.domain.room.model.request;

import com.mafia.domain.game.model.game.GameOption;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RoomRequest {

    private String title;
    private String password;  // null 허용 (비밀번호 없는 방), 빈 문자열 허용 X
    private int requiredPlayers;
    private GameOption gameOption;
}