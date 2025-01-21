package com.mafia.room.service;

import com.mafia.room.model.dto.request.RoomRequest;
import com.mafia.room.model.dto.response.RoomResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
public interface RoomService {

    RoomResponse createRoom(RoomRequest roomRequest);

    List<RoomResponse> getAllRooms();

    RoomResponse getRoom(Long roomId);

    RoomResponse updateRoom(Long roomId, RoomRequest roomRequest);

    void deleteRoom(Long roomId);

}
