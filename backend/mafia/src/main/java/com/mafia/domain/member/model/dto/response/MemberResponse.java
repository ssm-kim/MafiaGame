package com.mafia.domain.member.model.dto.response;

import com.mafia.domain.member.model.entity.Member;
import lombok.Setter;

@Setter
public class MemberResponse {
    private String email;
    private String nickname;

    public static MemberResponse from(Member member) {
        MemberResponse response = new MemberResponse();
        response.setEmail(member.getEmail()); // Member 클래스에 getEmail() 메서드가 있어야 합니다.
        response.setNickname(member.getNickname()); // Member 클래스에 getNickname() 메서드가 있어야 합니다.
        return response;
    }
}
