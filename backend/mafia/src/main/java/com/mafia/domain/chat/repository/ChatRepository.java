package com.mafia.domain.chat.repository;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.domain.chat.model.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ChatRepository {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 특정 채팅 채널에 메시지 저장 (최대 150개 유지)
     */
    public void saveMessage(String roomId, String chatType, ChatMessage message) {
        ListOperations<String, String> listOps = redisTemplate.opsForList();
        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            String redisKey = "chat:" + roomId + ":" + chatType; // 채널별 키 구분
            listOps.rightPush(redisKey, jsonMessage);
            listOps.trim(redisKey, -150, -1); // 150개 초과 시 오래된 메시지 삭제
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert ChatMessage to JSON", e);
        }
    }

    /**
     * 특정 채팅 채널의 최근 N개 메시지 가져오기
     */
    public List<ChatMessage> getRecentMessages(String roomId, String chatType, int count) {
        ListOperations<String, String> listOps = redisTemplate.opsForList();
        String redisKey = "chat:" + roomId + ":" + chatType; // 채널별 키 구분
        List<String> messages = listOps.range(redisKey, -count, -1); // 최신 count개 메시지 가져오기
        return messages.stream().map(json -> {
            try {
                return objectMapper.readValue(json, ChatMessage.class);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to parse JSON to ChatMessage", e);
            }
        }).collect(Collectors.toList());
    }
}

