package com.mafia.domain.login.model.dto;


import com.mafia.domain.member.model.dto.MemberDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@RequiredArgsConstructor
public class CustomOAuth2User implements OAuth2User {

    private final MemberDTO memberDTO;

    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> collection = new ArrayList<>();
        // 모든 사용자에게 기본 "ROLE_USER" 권한 부여
        collection.add(() -> "ROLE_USER");
        return collection;
    }

    @Override
    public String getName() {
        return memberDTO.getNickname();
    }

    public String getProviderId() {
        return memberDTO.getProviderId();
    }

    public Long getMemberId() {
        return memberDTO.getMemberId();
    }
}