package com.mafia.global.common.utils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("local") // "dev" 프로파일에서만 실행
@RequiredArgsConstructor
@Slf4j
public class RedisInitializer implements ApplicationRunner {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // 현재 데이터베이스의 모든 키 삭제 (단, flushAll은 클러스터 등 환경에 따라 지원되지 않을 수 있으므로 flushDb() 사용)
        redisTemplate.execute((RedisCallback<Object>) connection -> {
            connection.flushDb();
            log.warn("Redis 초기화(로컬 Profile만 진행)");
            return null;
        });
    }
}
