package com.mafia.domain.game.controller;

import com.mafia.domain.chat.model.dto.ChatRoom;
import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.GamePhase;
import com.mafia.domain.game.model.game.Role;
import com.mafia.domain.game.model.game.STATUS;
import com.mafia.domain.game.service.GameService;
import com.mafia.global.common.model.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@Tag(name = "Game Controller", description = "APIs for managing zombie game")

public class GameController {

    private final GameService gameService;

    /*
    TODO:
     1. 게임은 낮과 밤으로 구성되어 있고 각각의 행동이 다르다.
     2. 경찰은 직업을 알 수 있고, 의사는 살릴 수 있다.
     3. 게임이 종료되면 삭제 후 이전 방으로 되돌아간다.
     4. 게임이 끝나면 결과를 알려준다.
     5. 투표는 매일 낮 진행되며, 밤에는 투표가 없다.
     6. 살인은 매일 밤 진행되며, 경찰과 의사의 행동 또한 밤으로 제한한다.
     7. 돌연변이는 투표를 하지 못하며, 투표 시간에 죽일 사람을 지정한다.
     8. 경찰은 좀비를 찾게 되면 투표권이 없어진다.
     */

    @GetMapping("/{roomId}/start")
    @Operation(summary = "Start game", description = "Starts the game for the given room ID.")
    public ResponseEntity<BaseResponse<String>> startGame(@PathVariable Long roomId) {
        boolean started = gameService.startGame(roomId);
        return ResponseEntity.ok(new BaseResponse<>("Game started in Room " + roomId + "."));
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "Get game", description = "Retrieves the game details for the given room ID.")
    public ResponseEntity<BaseResponse<Game>> getGame(@PathVariable Long roomId) {
        Game game = gameService.findById(roomId);
        return ResponseEntity.ok(new BaseResponse<>(game));
    }

    @DeleteMapping("/{roomId}")
    @Operation(summary = "Delete game", description = "Deletes the game for the given room ID.")
    public ResponseEntity<BaseResponse<String>> deleteGame(@PathVariable Long roomId) {
        gameService.deleteGame(roomId);
        return ResponseEntity.ok(new BaseResponse<>("Room " + roomId + " deleted."));
    }
    /*
    @PostMapping("/{roomId}/join")
    public ResponseEntity<String> joinGame(@PathVariable int roomId, @RequestBody User user) {
        gameService.addPlayer(roomId, user);
        return ResponseEntity.ok("User " + user.getId() + " joined Room " + roomId + ".");
    }


    @PostMapping("/{roomId}/ready/{userId}")
    public ResponseEntity<String> readyPlayer(@PathVariable int roomId, @PathVariable Long userId) {
        boolean isReady = gameService.readyPlayer(roomId, userId);
        return ResponseEntity.ok("User " + userId + " is ready. All ready: " + isReady);
    }*/

    @PostMapping("/{roomId}/vote")
    @Operation(summary = "Vote", description = "Records a vote from a user for a target in the given room.")
    public ResponseEntity<BaseResponse<String>> vote(@PathVariable Long roomId, @RequestParam Long userId, @RequestParam Long targetId) {
        gameService.validatePhase(roomId, GamePhase.DAY_VOTE);
        gameService.vote(roomId, userId, targetId);
        return ResponseEntity.ok(new BaseResponse<>("User " + userId + " voted for " + targetId + " in Room " + roomId + "."));
    }

    @GetMapping("/{roomId}/voteresult")
    @Operation(summary = "Get vote result", description = "Returns the result of the vote in the given room.")
    public ResponseEntity<BaseResponse<Long>> getVoteResult(@PathVariable Long roomId) {
        Long result = gameService.getVoteResult(roomId);
        return ResponseEntity.ok(new BaseResponse<>(result));
    }

    @GetMapping("/{roomId}/clear/vote")
    @Operation(summary = "vote Init", description = "Reset the result of the vote in the given room.")
    public ResponseEntity<BaseResponse<Long>> resetVote(@PathVariable Long roomId) {
        Long result = gameService.getVoteResult(roomId);
        return ResponseEntity.ok(new BaseResponse<>(result));
    }

    @PostMapping("/{roomId}/vote/kill/{userId}")
    @Operation(summary = "Kill player", description = "Marks the specified user as killed in the given room.")
    public ResponseEntity<BaseResponse<String>> killVote(@PathVariable Long roomId, @PathVariable Long userId) {
        boolean life = gameService.killPlayer(roomId, userId, true);
        if(life) return ResponseEntity.ok(new BaseResponse<>("killed in Room " + roomId + "."));
        else return ResponseEntity.ok(new BaseResponse<>("saved in Room " + roomId + "."));
    }

    @PostMapping("/{roomId}/target/kill/{userId}")
    @Operation(summary = "Kill player", description = "Marks the specified user as killed in the given room.")
    public ResponseEntity<BaseResponse<String>> killTarget(@PathVariable Long roomId, @PathVariable Long userId) {
        boolean life = gameService.killPlayer(roomId, userId, false);
        if(life) return ResponseEntity.ok(new BaseResponse<>("User " + userId + " killed in Room " + roomId + "."));
        else return ResponseEntity.ok(new BaseResponse<>("User " + userId + " saved in Room " + roomId + "."));
    }

    @PostMapping("/{roomId}/target/set")
    @Operation(summary = "Kill player", description = "Marks the specified user as killed in the given room.")
    public ResponseEntity<BaseResponse<String>> setTarget(@PathVariable Long roomId, @RequestParam Long userId, @RequestParam Long targetId) {
        gameService.validatePhase(roomId, GamePhase.NIGHT_ACTION);
        gameService.setKillTarget(roomId, userId, targetId);
        return ResponseEntity.ok(new BaseResponse<>("User " + targetId + " set as target in Room " + roomId + "."));
    }

    @PostMapping("/{roomId}/police")
    @Operation(summary = "Find user's Role", description = "Find user's Role in the given room.")
    public ResponseEntity<BaseResponse<String>> findRole(@PathVariable Long roomId, @RequestParam Long userId, @RequestParam Long targetId) {
        gameService.validatePhase(roomId, GamePhase.NIGHT_ACTION);
        Role role = gameService.findRole(roomId, userId, targetId);
        return ResponseEntity.ok(new BaseResponse<>("User " + targetId + " is " + role + " in Room " + roomId + "."));
    }

    @PostMapping("/{roomId}/doctor")
    @Operation(summary = "Heal player", description = "Heal player in the given room.")
    public ResponseEntity<BaseResponse<String>> healPlayer(@PathVariable Long roomId, @RequestParam Long userId, @RequestParam Long targetId) {
        gameService.validatePhase(roomId, GamePhase.NIGHT_ACTION);
        gameService.healPlayer(roomId, userId, targetId);
        return ResponseEntity.ok(new BaseResponse<>("User " + targetId + " healed in Room " + roomId + "."));
    }

    @GetMapping("/{roomId}/isEnd")
    @Operation(summary = "Check game over", description = "Checks if the game is over for the given room.")
    public ResponseEntity<BaseResponse<STATUS>> isEnd(@PathVariable Long roomId) {
        STATUS status = gameService.isEnd(roomId);
        if(status != STATUS.PLAYING) {
            /*
            * 게임 로그 저장 기능 구현하기
            * */
            gameService.deleteGame(roomId);
        }
        return ResponseEntity.ok(new BaseResponse<>(status));
    }

    @GetMapping("/{roomId}/status")
    public ResponseEntity<BaseResponse<?>> getStatus(@PathVariable long roomId) {
        GamePhase phase = gameService.getPhase(roomId);
        Long Time = gameService.getTime(roomId);

        Map<String, Object> response = new HashMap<>();
        response.put("currentphase", phase);
        response.put("remainingtime", Time);

        return ResponseEntity.ok(new BaseResponse<>(response));
    }
}
