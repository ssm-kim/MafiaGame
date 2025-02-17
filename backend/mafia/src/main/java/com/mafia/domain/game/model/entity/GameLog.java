package com.mafia.domain.game.model.entity;

import com.mafia.domain.game.model.game.GAMESTATUS;
import com.mafia.global.common.model.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Builder
@EntityListeners(AuditingEntityListener.class)
@AllArgsConstructor
public class GameLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    private Long gameId;
    private Integer playerCnt;
    @Enumerated(EnumType.STRING)
    private GAMESTATUS winRole;
    private String version;

    protected GameLog(){}

    public GameLog(Long gameId, GAMESTATUS winRole, Integer playerCnt, String version) {
        this.gameId = gameId;
        this.winRole = winRole;
        this.playerCnt = playerCnt;
        this.version = version;
    }

}
