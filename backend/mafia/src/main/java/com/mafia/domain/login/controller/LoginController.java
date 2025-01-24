package com.mafia.domain.login.controller;


import com.mafia.global.common.model.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.mafia.global.common.model.dto.BaseResponseStatus.AUTHORIZATION_SUCCESS;

@Slf4j
@RestController
@RequestMapping("/api/login")
@RequiredArgsConstructor
public class LoginController {

    @GetMapping("/success")
    public ResponseEntity<BaseResponse<Void>> loginSuccess() {
        return ResponseEntity.ok(new BaseResponse<>(AUTHORIZATION_SUCCESS));
    }
}
