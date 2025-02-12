package com.mafia.domain.member.model.entity;

import com.mafia.global.common.model.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Builder
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long memberId;

    @Column(unique = true)
    private String providerId;
    private String email;
    private String nickname;

    // lastActivityTime은 게스트일 때만 사용됨
    @Column
    private LocalDateTime lastActivityTime;

    public Member(Long memberId) {
        this.memberId = memberId;
    }

    @Builder
    public Member(String providerId, String nickname, String email,
        LocalDateTime lastActivityTime) {
        this.providerId = providerId;
        this.nickname = nickname;
        this.email = email;
        // providerId가 guest로 시작할 경우에만 lastActivityTime 설정
        if (providerId.startsWith("guest_")) {
            this.lastActivityTime = LocalDateTime.now();
        }
    }

    public static Member of(String providerId, String nickname, String email) {
        return Member.builder()
            .providerId(providerId)
            .nickname(nickname)
            .email(email)
            .build();
    }

    public void updateLastActivityTime() {
        if (this.providerId.startsWith("guest_")) {
            this.lastActivityTime = LocalDateTime.now();
        }
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }


}
