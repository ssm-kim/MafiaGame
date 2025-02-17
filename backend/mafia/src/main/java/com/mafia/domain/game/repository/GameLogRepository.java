package com.mafia.domain.game.repository;

import com.mafia.domain.game.model.entity.GameLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameLogRepository  extends JpaRepository<GameLog, Long> {

}
