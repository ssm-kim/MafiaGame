package com.mafia.domain.login.utils;

import com.mafia.domain.login.model.dto.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationUtil {

    public String getProviderId() {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getPrincipal();
        return oAuth2User.getProviderId();
    }

    public Long getMemberId() {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getPrincipal();
        return oAuth2User.getMemberId();
    }
}