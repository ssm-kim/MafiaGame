package com.mafia.domain.game.service;

import com.mafia.domain.game.model.pos.PlayerPosition;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class GamePositionService {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<Long, PlayerPosition>> gamePositions = new ConcurrentHashMap<>();

    public Map<Long, PlayerPosition> initGamePositions(Long roomId,
        Map<Long, PlayerPosition> initialPositions) {
        ConcurrentHashMap<Long, PlayerPosition> roomPositions = new ConcurrentHashMap<>(
            initialPositions);
        gamePositions.put(roomId, roomPositions);
        log.info("Initialized positions for room {} with {} players", roomId,
            initialPositions.size());
        return roomPositions;
    }

    public Map<Long, PlayerPosition> updateAndGetPositions(Long roomId, PlayerPosition position) {
        ConcurrentHashMap<Long, PlayerPosition> roomPositions = gamePositions.computeIfAbsent(
            roomId, k -> new ConcurrentHashMap<>());

        PlayerPosition previousPosition = roomPositions.get(position.getMemberId());
        if (previousPosition != null) {
            log.info("Player {} moved from ({}, {}) to ({}, {})",
                position.getMemberId(),
                previousPosition.getX(), previousPosition.getY(),
                position.getX(), position.getY());
        }

        roomPositions.put(position.getMemberId(), position);
        return roomPositions;
    }

    public void clearAllGamePositions() {
        gamePositions.clear();
        log.info("Cleared all game positions");
    }
}