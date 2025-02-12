package com.mafia.domain.member.repository;

import com.mafia.domain.member.model.entity.Member;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByProviderId(String providerId);

    @Query("SELECT m FROM Member m WHERE m.providerId LIKE 'guest_%' AND m.lastActivityTime < :threshold")
    List<Member> findInactiveGuestAccounts(LocalDateTime threshold);
}