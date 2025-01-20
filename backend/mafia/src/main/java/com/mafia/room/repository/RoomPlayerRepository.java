package com.mafia.room.repository;

import com.mafia.room.entity.Room;
import com.mafia.room.entity.RoomPlayer;
import com.mafia.room.entity.RoomPlayerId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomPlayerRepository extends JpaRepository<RoomPlayer, RoomPlayerId> {
    List<RoomPlayer> findByIdRoomId(Long roomId);
    Optional<RoomPlayer> findByIdMemberIdAndIdRoomId(Long memberId, Long roomId);
}