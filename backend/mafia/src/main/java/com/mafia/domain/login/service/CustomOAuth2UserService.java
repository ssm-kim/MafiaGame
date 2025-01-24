package com.mafia.domain.login.service;

import com.mafia.domain.login.model.dto.CustomOAuth2User;
import com.mafia.domain.login.model.dto.KakaoResponse;
import com.mafia.domain.login.model.dto.NaverResponse;
import com.mafia.domain.login.model.dto.OAuth2Response;
import com.mafia.domain.member.model.dto.MemberDTO;
import com.mafia.domain.member.model.entity.Member;
import com.mafia.domain.member.repository.MemberRepository;
import com.mafia.domain.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;
    private final MemberService memberService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(userRequest);

        System.out.println(oAuth2User);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2Response oAuth2Response = null;
        if (registrationId.equals("naver")) {

            oAuth2Response = new NaverResponse(oAuth2User.getAttributes());
        } else if (registrationId.equals("kakao")) {

            oAuth2Response = new KakaoResponse(oAuth2User.getAttributes());
        } else {

            return null;
        }

        String providerId = oAuth2Response.getProvider() + "_" + oAuth2Response.getProviderId();
        Optional<Member> optionalMember = memberRepository.findByProviderId(providerId);
        Member member;
        if (optionalMember.isEmpty()) {
            member = Member.of(providerId, oAuth2Response.getName(), oAuth2Response.getEmail());
            memberRepository.save(member);
        } else {
            member = optionalMember.get();
        }
        return new CustomOAuth2User(MemberDTO.from(member));
    }
}