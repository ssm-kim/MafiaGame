package com.mafia.domain.room.repository;

import com.mafia.domain.room.model.entity.RoomPlayer;
import com.mafia.domain.room.model.entity.RoomPlayerId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 게임방 참가자 정보를 관리하는 레포지토리
 * RoomPlayer 엔티티와 복합키 RoomPlayerId를 사용
 */

@Repository
public interface RoomPlayerRepository extends JpaRepository<RoomPlayer, RoomPlayerId> {

    /** 방의 모든 참가자를 조회합니다. */
    List<RoomPlayer> findByIdRoomId(Long roomId);

    /** 방의 특정 참가자를 조회합니다. */
    Optional<RoomPlayer> findByIdMemberIdAndIdRoomId(Long memberId, Long roomId);

    /** 전체 방에 대한 참가 여부 확인 */
    Optional<RoomPlayer> findByIdMemberId(Long memberId);
}