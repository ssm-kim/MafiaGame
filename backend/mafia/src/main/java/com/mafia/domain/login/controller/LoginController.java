package com.mafia.domain.login.controller;


import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.login.service.LoginService;
import com.mafia.domain.login.service.LogoutService;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.global.common.model.dto.BaseResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;
    private final LogoutService logoutService;
    private final MemberService memberService;

    //TODO : 로그아웃 기준을 웹이 꺼질때도 포함 시켜야함.

    @PostMapping("/login/guest")
    public ResponseEntity<BaseResponse<MemberResponse>> guestLogin(HttpServletResponse response) {
        MemberResponse memberResponse = loginService.guestLogin(response);
        return ResponseEntity.ok(new BaseResponse<>(memberResponse));
    }

    @GetMapping("/login/success")
    public ResponseEntity<BaseResponse<MemberResponse>> loginSuccess(
        @AuthenticationPrincipal AuthenticatedUser detail) {
        MemberResponse memberResponse = memberService.getMemberInfo(detail.getMemberId());

        return ResponseEntity.ok(new BaseResponse<>(memberResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(
        @AuthenticationPrincipal AuthenticatedUser detail,
        HttpServletResponse response) {

        logoutService.logout(detail, response);
        return ResponseEntity.ok(new BaseResponse<>());
    }
}
