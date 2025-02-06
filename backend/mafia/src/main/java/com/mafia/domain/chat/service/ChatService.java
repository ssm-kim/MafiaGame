package com.mafia.domain.chat.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.MEMBER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_PERMISSION_CHAT;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.domain.chat.model.dto.ChatMessage;
import com.mafia.domain.chat.model.dto.GetMessageRequest;
import com.mafia.domain.chat.model.enumerate.ChatType;
import com.mafia.domain.chat.repository.ChatRepository;
import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.service.GameService;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.service.RoomRedisService;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


/**
 * 채팅 서비스
 * <p>
 * 이 서비스는 채팅 메시지의 검증, 저장, 전송을 담당하며, Redis Pub/Sub을 이용하여 메시지를 브로드캐스트합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatPublisher chatPublisher; // Redis Pub/Sub을 이용한 메시지 전송

    private final ChatRepository chatRepository; // 채팅 메시지 저장 및 조회

    private final GameService gameService; // 게임 정보 조회

    private final RoomRedisService roomService; // 게임 방 정보 조회

    private final MemberService memberService; // 사용자 정보 조회

    /**
     * 특정 게임의 채팅 채널을 검증하여 Redis Pub/Sub 채널 토픽을 반환
     *
     * @param gameId   게임 ID
     * @param type     채팅 유형 (PUBLIC, PRIVATE 등)
     * @param memberId 요청한 사용자 ID
     * @return Redis Pub/Sub 채널 토픽
     * @throws BusinessException 사용자가 해당 채널에 접근 권한이 없을 경우 발생
     */
    private String getvalidGameTopic(Long gameId, ChatType type, Long memberId){

        Game game = gameService.findById(gameId);
        Player player = game.getPlayers().get(memberId);

        if (player == null) throw new BusinessException(MEMBER_NOT_FOUND);

        String topic ="game-" + gameId + "-" + type + "-chat";

        // 🔥 플레이어가 해당 채널을 구독하고 있는지 확인
        if (!player.isSubscribed(topic)) throw new BusinessException(NOT_PERMISSION_CHAT);

        return topic; // Redis Pub/Sub 채널
    }

    /**
     * 특정 게임 방의 채팅 채널을 검증하여 Redis Pub/Sub 채널 토픽을 반환
     *
     * @param roomId   게임 방 ID
     * @param memberId 요청한 사용자 ID
     * @return Redis Pub/Sub 채널 토픽
     * @throws BusinessException 사용자가 해당 채널에 접근 권한이 없을 경우 발생
     */
    private String getvalidRoomTopic(Long roomId, Long memberId){

        RoomInfo room = roomService.findById(roomId);
        Participant participant = room.getParticipant().get(memberId);

        if (participant == null) throw new BusinessException(MEMBER_NOT_FOUND);

        return "room-" + roomId + "-chat"; // Redis Pub/Sub 채널
    }

    /**
     * 플레이어가 채팅 메시지를 보내면 검증 후 저장 및 Redis Pub/Sub으로 전송
     *
     * @param message  전송할 채팅 메시지
     * @param memberId 요청한 사용자 ID
     * @throws JsonProcessingException 메시지 직렬화 오류 발생 시
     */
    public void sendMessage(ChatMessage message, Long memberId) throws JsonProcessingException {
        long gameId = message.getGameId();
        ChatType type = message.getChatType();
        String content = message.getContent();
        String topic;

        if(type == ChatType.room) topic = getvalidRoomTopic(gameId, memberId); // Room
        else topic = getvalidGameTopic(gameId, type, memberId); //Game(day, night, dead)
        chatRepository.saveMessage(message);

        MemberResponse memberInfo = memberService.getMemberInfo(memberId);

        // JSON 형태로 메시지 구성
        Map<String, String> payload = new HashMap<>();
        payload.put("nickname", memberInfo.getNickname()); // 닉네임 추가
        payload.put("content", content); // 메시지 내용 추가

        // JSON 변환
        String jsonMessage = new ObjectMapper().writeValueAsString(payload);

        // Redis Pub/Sub을 통해 메시지 전송
        chatPublisher.publish(topic, jsonMessage);

        log.info("📨 플레이어 [{}]님이 [{}] 채널에 메시지를 보냈습니다: {}",
            memberInfo.getNickname(), topic, content);
    }

    /**
     * 특정 채팅 채널의 최근 채팅 메시지 조회
     *
     * @param req      채팅 메시지 조회 요청 DTO (게임 ID 포함)
     * @param count    가져올 메시지 개수
     * @param memberId 요청한 사용자 ID
     * @return 최근 채팅 메시지 목록
     * @throws BusinessException 사용자가 해당 채널에 접근 권한이 없을 경우 발생
     */
    public List<ChatMessage> getRecentMessages(GetMessageRequest req, int count, Long memberId) {
        long gameId = req.getGameId();
        ChatType type = req.getChatType();
        String topic;
        if(type == ChatType.room) topic = getvalidRoomTopic(gameId, memberId); // Room
        else topic = getvalidGameTopic(gameId, type, memberId); //Game(day, night, dead)
        return chatRepository.getRecentMessages(String.valueOf(gameId), String.valueOf(type), count);
    }
}