package com.mafia.domain.chat.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatPublisher {

    private final StringRedisTemplate redisTemplate;

    public ChatPublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(String topic, String message) {
        redisTemplate.convertAndSend(topic, message);
    }
}
