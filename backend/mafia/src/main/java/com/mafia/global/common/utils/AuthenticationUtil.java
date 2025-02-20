package com.mafia.global.common.utils;

import com.mafia.domain.login.model.dto.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationUtil {

    public String getProviderId() {
        AuthenticatedUser oAuth2User = (AuthenticatedUser) SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getPrincipal();
        return oAuth2User.getProviderId();
    }

    public Long getMemberId() {
        AuthenticatedUser oAuth2User = (AuthenticatedUser) SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getPrincipal();
        return oAuth2User.getMemberId();
    }
}