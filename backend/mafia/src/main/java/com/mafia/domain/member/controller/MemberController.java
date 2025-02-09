package com.mafia.domain.member.controller;

import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.member.model.dto.request.NicknameRequest;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.model.dto.response.NicknameResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.global.common.model.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    //회원 조회
    @GetMapping
    public ResponseEntity<BaseResponse<MemberResponse>> getMemberInfo(
            @AuthenticationPrincipal AuthenticatedUser detail) {
        MemberResponse memberResponse = memberService.getMemberInfo(detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>(memberResponse));
    }

    //닉네임 수정
    @PatchMapping("/nickname")
    public ResponseEntity<BaseResponse<NicknameResponse>> updateNickname(
            @AuthenticationPrincipal AuthenticatedUser detail,
            @RequestBody NicknameRequest nicknameRequest) {
        NicknameResponse nicknameResponse = memberService.updateNickname(detail.getMemberId(), nicknameRequest.getNickname());
        return ResponseEntity.ok(new BaseResponse<>(nicknameResponse));
    }

    //상태 변경
    @PatchMapping("/status")
    public ResponseEntity<BaseResponse<Void>> updateMemberStatus(
            @AuthenticationPrincipal AuthenticatedUser detail) {
        memberService.updateStatusMember(detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>());
    }
}