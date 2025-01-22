package com.mafia.domain.room.repository;

import com.mafia.domain.room.model.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 게임방의 기본 정보를 관리하는 레포지토리
 * Room 엔티티에 대한 기본적인 CRUD 작업을 제공
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    // 기본 CRUD 메서드는 JpaRepository에서 제공
}