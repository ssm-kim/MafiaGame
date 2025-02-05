package com.mafia.domain.game.model.pos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerPosition {

    private Long memberId;
    private double x;
    private double y;
}
