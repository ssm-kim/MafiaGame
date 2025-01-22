package com.mafia.domain.room.repository;

import com.mafia.domain.room.model.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 게임방 정보에 접근하는 레포지토리입니다.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

}