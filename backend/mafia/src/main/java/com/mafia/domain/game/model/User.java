package com.mafia.domain.game.model;

import lombok.Data;

@Data
public class User {

    private long id;
    private String nickname; // 게임 내 표시 닉네임

    /**
     * 한 유저가 동시에 여러 게임에 참가하지 못하도록 제어하기 위한 플래그 예: true = 게임 참여중, false = 게임 미참여
     */

    // 생성자
    public User(long id, String nickname) {
        this.id = id;
        this.nickname = nickname;
    }
}