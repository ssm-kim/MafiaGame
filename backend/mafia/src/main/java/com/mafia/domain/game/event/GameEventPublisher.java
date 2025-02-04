package com.mafia.domain.game.event;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Service
public class GameEventPublisher {

    private final StringRedisTemplate redisTemplate;
    private final ChannelTopic gamePhaseTopic;
    private final ChannelTopic voteResultTopic;
    private final ChannelTopic roundResultTopic;

    public GameEventPublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.gamePhaseTopic = new ChannelTopic("game-phase");
        this.voteResultTopic = new ChannelTopic("vote-result");
        this.roundResultTopic = new ChannelTopic("round-result");
    }

    public void publishGamePhase(String message) {
        redisTemplate.convertAndSend(gamePhaseTopic.getTopic(), message);
    }

    public void publishVoteResult(String message) {
        redisTemplate.convertAndSend(voteResultTopic.getTopic(), message);
    }

    public void publishRoundResult(String message) {
        redisTemplate.convertAndSend(roundResultTopic.getTopic(), message);
    }
}
