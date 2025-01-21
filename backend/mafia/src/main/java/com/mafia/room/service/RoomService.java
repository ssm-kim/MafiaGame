package com.mafia.room.service;

import com.mafia.room.dto.response.RoomResponse;
import com.mafia.room.entity.Room;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
public interface RoomService {

    Room createRoom(Room room);

    List<RoomResponse> getAllRooms();

    Room getRoom(Long roomId);

    Room updateRoom(Long roomId, Room roomRequest);

    void deleteRoom(Long roomId);
}
