package com.mafia.domain.member.model.entity;

import com.mafia.global.common.model.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

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

    public Member(Long memberId) {
        this.memberId = memberId;
    }

    public static Member of(String providerId, String nickname, String email) {
        return Member.builder()
            .providerId(providerId)
            .nickname(nickname)
            .email(email)
            .build();
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }
}
