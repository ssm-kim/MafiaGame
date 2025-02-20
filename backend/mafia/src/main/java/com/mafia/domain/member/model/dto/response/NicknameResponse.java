package com.mafia.domain.member.model.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NicknameResponse {
    private String nickname;

    public NicknameResponse(String nickname) {
        this.nickname = nickname;
    }
}
