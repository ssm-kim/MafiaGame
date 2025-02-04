package com.mafia.global.common.config;

import com.mafia.domain.chat.service.ChatSubscriber;
import com.mafia.domain.room.model.redis.RoomInfo;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
        RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);

        // Key serializer
        redisTemplate.setKeySerializer(new StringRedisSerializer());

        // Value serializer
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        return redisTemplate;
    }

    @Bean
    public RedisTemplate<String, RoomInfo> RoomredisTemplate(
        RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, RoomInfo> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);

        // Key serializer
        redisTemplate.setKeySerializer(new StringRedisSerializer());

        // Value serializer
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        return redisTemplate;
    }

    // 🔥 Redis Pub/Sub 설정 추가
    // 🔥 채팅 채널 설정
    @Bean
    public ChannelTopic dayChatTopic() {
        return new ChannelTopic("day-chat");
    }

    @Bean
    public ChannelTopic nightChatTopic() {
        return new ChannelTopic("night-chat");
    }

    @Bean
    public ChannelTopic deadChatTopic() {
        return new ChannelTopic("dead-chat");
    }

//    @Bean
//    public ChannelTopic roomChatTopic() {
//        return new ChannelTopic("room-chat");
//    }

    // 🔥 게임 이벤트 채널 설정
    @Bean
    public ChannelTopic gamePhaseTopic() {
        return new ChannelTopic("game-phase");
    }

    @Bean
    public ChannelTopic voteResultTopic() {
        return new ChannelTopic("vote-result");
    }

    @Bean
    public ChannelTopic roundResultTopic() {
        return new ChannelTopic("round-result");
    }


    // 🔥 Redis 메시지 리스너 설정
    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory connectionFactory,
        MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, dayChatTopic());
        container.addMessageListener(listenerAdapter, nightChatTopic());
        container.addMessageListener(listenerAdapter, deadChatTopic());
        //container.addMessageListener(listenerAdapter, roomChatTopic());

        container.addMessageListener(listenerAdapter, gamePhaseTopic());
        container.addMessageListener(listenerAdapter, voteResultTopic());
        container.addMessageListener(listenerAdapter, roundResultTopic());
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(ChatSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "onMessage");
    }

}