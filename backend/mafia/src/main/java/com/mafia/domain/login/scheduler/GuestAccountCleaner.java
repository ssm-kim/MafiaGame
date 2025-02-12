package com.mafia.domain.login.scheduler;

import com.mafia.domain.member.model.entity.Member;
import com.mafia.domain.member.repository.MemberRepository;
import com.mafia.global.common.service.RedisService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GuestAccountCleaner {

    private final MemberRepository memberRepository;
    private final RedisService redisService;

    @Scheduled(fixedRate = 1800000) // 30분마다 실행
    public void cleanupGuestAccounts() {
        LocalDateTime inactiveThreshold = LocalDateTime.now().minusMinutes(30);

        // 마지막 활동 시간이 30분 이상 지난 게스트 계정 조회
        List<Member> inactiveGuests = memberRepository.findInactiveGuestAccounts(inactiveThreshold);

        for (Member guest : inactiveGuests) {
            // Redis에서 토큰 제거
            redisService.delete(guest.getProviderId());
            // DB에서 게스트 계정 제거
            memberRepository.delete(guest);
        }
    }
}
