package com.mafia.domain.chat.controller;

import com.mafia.domain.chat.model.dto.ChatRoom;
import com.mafia.domain.chat.model.enumerate.ChatRoomType;
import com.mafia.domain.chat.service.ChatService;
import com.mafia.global.common.model.dto.BaseResponse;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    /*
    TODO:
     1. 채팅방 생성은 방생성될 때, 동시에 보낼 수 있도록 한다.
     2. 채팅방 전체 조회는 마피아,시민 전용채팅으로 사용할 기능으로 한다.
     3. 게임방이 삭제될 때, 채팅방도 같이 삭제되어야한다.
     4. 예외 처리
     */

    //채팅방 생성
    @PostMapping("/room")
    public ResponseEntity<BaseResponse<ChatRoom>> createRoom(
        @RequestParam ChatRoomType type,
        @RequestParam Long roomId) {
        ChatRoom chatRoom = chatService.createRoom(type, roomId);
        return ResponseEntity.ok(new BaseResponse<>(chatRoom));
    }

    //채팅방 전체 조회
    @GetMapping("/rooms")
    public ResponseEntity<BaseResponse<List<ChatRoom>>> getRooms() {
        List<ChatRoom> rooms = new ArrayList<>(chatService.getAllRooms().values());
        return ResponseEntity.ok(new BaseResponse<>(rooms));
    }

    //채팅방 입장
    @GetMapping("/room/{chatRoomId}")
    public ResponseEntity<BaseResponse<ChatRoom>> getRoom(@PathVariable String chatRoomId) {
        ChatRoom room = chatService.findRoomById(chatRoomId);
        return ResponseEntity.ok(new BaseResponse<>(room));
    }

    //채팅방 삭제
    @DeleteMapping("/room/{chatRoomId}")
    public ResponseEntity<BaseResponse<Void>> deleteRoom(@PathVariable String chatRoomId) {
        chatService.removeRoom(chatRoomId);

        return ResponseEntity.ok(new BaseResponse<>());
    }
}