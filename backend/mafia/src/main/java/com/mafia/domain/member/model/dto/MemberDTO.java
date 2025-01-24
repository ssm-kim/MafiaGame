package com.mafia.domain.member.model.dto;

import com.mafia.domain.member.model.entity.Member;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberDTO {
    private Long memberId;
    private String providerId;
    private String email;
    private String nickname;

    @Builder
    public MemberDTO(Long memberId, String providerId, String email, String nickname) {
        this.memberId = memberId;
        this.providerId = providerId;
        this.email = email;
        this.nickname = nickname;
    }

    public static MemberDTO from(Member member) {
        return MemberDTO.builder()
                .memberId(member.getMemberId())
                .providerId(member.getProviderId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .build();
    }
}