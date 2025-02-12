package com.mafia.domain.chat.model;

import java.security.Principal;

// STOMP에서 사용할 단순한 Principal 구현체
public class StompPrincipal implements Principal {

    private final Long memberId;

    public StompPrincipal(Long memberId) {
        this.memberId = memberId;
    }

    @Override
    public String getName() {
        // STOMP에서는 getName()을 사용자 식별용으로 사용합니다.
        return String.valueOf(memberId); // 또는 원한다면 nickname 등 다른 값을 반환할 수 있음
    }

    public Long getMemberId() {
        return memberId;
    }
}
