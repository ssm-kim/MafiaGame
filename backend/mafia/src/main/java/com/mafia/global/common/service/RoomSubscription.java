package com.mafia.global.common.service;

import com.mafia.domain.chat.service.ChatSubscriber;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomSubscription implements Subscription{

    private final RedisMessageListenerContainer redisMessageListenerContainer;
    private final ChatSubscriber chatSubscriber;
    private final Map<String, ChannelTopic> activeTopics = new HashMap<>();

    @Override
    public void subscribe(Long roomId){
        String topicName = "room-" + roomId + "-chat";
        ChannelTopic topic = new ChannelTopic(topicName);

        if (!activeTopics.containsKey(topicName)) {
            redisMessageListenerContainer.addMessageListener(chatSubscriber, topic);
            activeTopics.put(topicName, topic);
            log.info("✅ Redis 방 채널 구독 시작: {}", topicName);
        }
    }

    @Override
    public void unsubscribe(Long roomId){
        String topicName = "room-" + roomId + "-chat";
        ChannelTopic topic = new ChannelTopic(topicName);

        if (!activeTopics.containsKey(topicName)) {
            redisMessageListenerContainer.addMessageListener(chatSubscriber, topic);
            activeTopics.put(topicName, topic);
            log.info("✅ Redis 방 채널 구독 시작: {}", topicName);
        }
    }
}
