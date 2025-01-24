package com.mafia.domain.chat.service;

import com.mafia.domain.chat.model.dto.ChatRoom;
import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.model.dto.BaseResponseStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {


    /*
    TODO: 예외처리 변경
     */

    // 모든 채팅방을 관리
    private final Map<String, ChatRoom> chatRooms = new ConcurrentHashMap<>();

    // 채팅방 생성
    public ChatRoom createRoom() {
        ChatRoom chatRoom = ChatRoom.create();
        chatRooms.put(chatRoom.getChatRoomId(), chatRoom);
        log.info("채팅방 생성: chatRoomId={}", chatRoom.getChatRoomId());
        return chatRoom;
    }

    // 특정 채팅방 조회
    public ChatRoom findRoomById(String chatRoomId) {
        return Optional.ofNullable(chatRooms.get(chatRoomId))
            .orElseThrow(() -> new BusinessException(BaseResponseStatus.NOT_FOUND_CHAT));
    }

    // 전체 채팅방 맵 반환
    public Map<String, ChatRoom> getAllRooms() {
        return chatRooms;
    }

    // 채팅방 삭제
    public void removeRoom(String chatRoomId) {
        Optional.ofNullable(chatRooms.remove(chatRoomId))
            .orElseThrow(() -> new BusinessException(BaseResponseStatus.NOT_FOUND_CHAT));
        log.info("채팅방 삭제: roomId={}", chatRoomId);
    }

    // 빈 채팅방 정리 (선택적)
    public void cleanEmptyRooms() {
        chatRooms.entrySet().removeIf(entry -> {
            ChatRoom room = entry.getValue();
            if (room.getSessions().isEmpty()) {
                log.info("빈 채팅방 정리: chatRoomId={}", room.getChatRoomId());
                return true;
            }
            return false;
        });
    }

}