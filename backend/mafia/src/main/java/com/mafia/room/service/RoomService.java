package com.mafia.room.service;

import com.mafia.room.dto.request.RoomRequest;
import com.mafia.room.dto.response.RoomResponse;
import com.mafia.room.entity.Room;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
public interface RoomService {

//    Room createRoom(RoomRequest requestDto);
//
//    List<RoomResponse> getAllRooms();
//
//    Room getRoom(Long roomId);
//
//    Room updateRoom(Long roomId, RoomRequest requestDto);
//
//    void deleteRoom(Long roomId);


    RoomResponse createRoom(RoomRequest requestDto);

    List<RoomResponse> getAllRooms();

    RoomResponse getRoom(Long roomId);

    RoomResponse updateRoom(Long roomId, RoomRequest requestDto);

    void deleteRoom(Long roomId);

}
