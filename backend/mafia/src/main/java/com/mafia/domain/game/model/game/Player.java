package com.mafia.domain.game.model.game;

import com.mafia.domain.game.model.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Player {
    private Long userId;
    private String nickname;
    private Role role;
    private boolean isDead;
    private boolean enableVote;

    public Player(User user){
        this.userId = user.getId();
        this.nickname = user.getNickname();
        this.role = Role.CITIZEN;
        this.isDead = false;
        this.enableVote = true;
    }
}