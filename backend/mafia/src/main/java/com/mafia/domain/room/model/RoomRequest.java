package com.mafia.domain.room.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RoomRequest {

    @NotBlank(message = "방 제목은 필수입니다")
    @Size(max = 30, message = "방 제목은 30자를 초과할 수 없습니다")
    private String roomTitle;

    @Size(max = 20, message = "비밀번호는 20자를 초과할 수 없습니다")
    private String roomPassword;

    @Min(value = 2, message = "최소 2명 이상이어야 합니다")
    @Max(value = 10, message = "최대 10명까지 가능합니다")
    private int requiredPlayer;
}