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
@Tag(name = "Game Controller", description = "좀비 기반 마피아 게임의 로직을 처리하는 API입니다.")

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

    @GetMapping("/{roomId}")
    @Operation(summary = "Get game", description = "방 ID로 게임 정보를 가져옵니다.")
    public ResponseEntity<BaseResponse<Game>> getGame(@PathVariable Long roomId) {
        Game game = gameService.findById(roomId);
        return ResponseEntity.ok(new BaseResponse<>(game));
    }

    @DeleteMapping("/{roomId}")
    @Operation(summary = "Delete game", description = "방 ID로 게임을 삭제합니다.")
    public ResponseEntity<BaseResponse<String>> deleteGame(@PathVariable Long roomId) {
        gameService.deleteGame(roomId);
        return ResponseEntity.ok(new BaseResponse<>("Room " + roomId + " deleted."));
    }

    @PostMapping("/{roomId}/vote")
    @Operation(summary = "Vote", description = "유저 ID와 타겟 ID를 받아 투표합니다.(투표 시간에만 가능합니다.")
    public ResponseEntity<BaseResponse<String>> vote(@PathVariable Long roomId,
        @RequestParam Integer playerNo, @RequestParam Integer targetNo) {
        gameService.validatePhase(roomId, GamePhase.DAY_VOTE);
        gameService.vote(roomId, playerNo, targetNo);
        return ResponseEntity.ok(new BaseResponse<>(
            "Player " + playerNo + " voted for " + targetNo + " in Room " + roomId + "."));
    }

    @GetMapping("/{roomId}/voteresult")
    @Operation(summary = "Get vote result", description = "투표 집계 결과를 가져옵니다")
    public ResponseEntity<BaseResponse<Integer>> getVoteResult(@PathVariable Long roomId) {
        return ResponseEntity.ok(new BaseResponse<>(gameService.getVoteResult(roomId)));
    }

    @GetMapping("/{roomId}/clear/vote")
    @Operation(summary = "Vote init", description = "방 투표 내역을 초기화 합니다.")
    public ResponseEntity<BaseResponse<Integer>> resetVote(@PathVariable Long roomId) {
        Integer result = gameService.getVoteResult(roomId);
        return ResponseEntity.ok(new BaseResponse<>(result));
    }

    @GetMapping("/{roomId}/skip")
    @Operation(summary = "Skip vote", description = "토론 시간을 단축합니다.(20초, 낮 토론 시간에만 가능합니다.)")
    public ResponseEntity<BaseResponse<String>> skipVote(@PathVariable Long roomId) {
        gameService.validatePhase(roomId, GamePhase.DAY_DISCUSSION);
        gameService.skipDiscussion(roomId, 20);
        return ResponseEntity.ok(new BaseResponse<>("Vote skipped in Room " + roomId + "."));
    }

    @GetMapping("/{roomId}/vote/kill/{playerNo}")
    @Operation(summary = "Vote kill player", description = "투표로 타겟이 된 플레이어를 사망 처리합니다.")
    public ResponseEntity<BaseResponse<String>> killVote(@PathVariable Long roomId,
        @PathVariable Integer playerNo) {
        boolean life = gameService.killPlayer(roomId, playerNo, true);
        if (life) {
            return ResponseEntity.ok(new BaseResponse<>("killed in Room " + roomId + "."));
        } else {
            return ResponseEntity.ok(new BaseResponse<>("saved in Room " + roomId + "."));
        }
    }

    @GetMapping("/{roomId}/target/kill/{playerNo}")
    @Operation(summary = "Night kill player", description = "밤 페이즈에 타겟이 된 플레이어를 사망 처리 합니다.")
    public ResponseEntity<BaseResponse<String>> killTarget(@PathVariable Long roomId,
        @PathVariable Integer playerNo) {
        boolean life = gameService.killPlayer(roomId, playerNo, false);
        if (life) {
            return ResponseEntity.ok(
                new BaseResponse<>("User " + playerNo + " killed in Room " + roomId + "."));
        } else {
            return ResponseEntity.ok(
                new BaseResponse<>("User " + playerNo + " saved in Room " + roomId + "."));
        }
    }

    @PostMapping("/{roomId}/target/set")
    @Operation(summary = "set target player", description = "타겟을 설정합니다.(밤 페이즈, 좀비, 돌연변이만 가능합니다.)")
    public ResponseEntity<BaseResponse<String>> setTarget(@PathVariable Long roomId,
        @RequestParam Integer playerNo, @RequestParam Integer targetNo) {
        gameService.validatePhase(roomId, GamePhase.NIGHT_ACTION);
        gameService.setKillTarget(roomId, playerNo, targetNo);
        return ResponseEntity.ok(
            new BaseResponse<>("User " + targetNo + " set as target in Room " + roomId + "."));
    }

    @PostMapping("/{roomId}/police")
    @Operation(summary = "Find user's role", description = "지정한 사람의 직업을 밝힙니다.(밤 페이즈, 경찰만 가능합니다.)")
    public ResponseEntity<BaseResponse<String>> findRole(@PathVariable Long roomId,
        @RequestParam Integer playerNo, @RequestParam Integer targetNo) {
        gameService.validatePhase(roomId, GamePhase.NIGHT_ACTION);
        Role role = gameService.findRole(roomId, playerNo, targetNo);
        return ResponseEntity.ok(
            new BaseResponse<>("User " + targetNo + " is " + role + " in Room " + roomId + "."));
    }

    @PostMapping("/{roomId}/doctor")
    @Operation(summary = "set save player", description = "죽음으로부터 보호할 사람을 지정합니다.(밤 페이즈, 의사만 가능합니다.)")
    public ResponseEntity<BaseResponse<String>> healPlayer(@PathVariable Long roomId,
        @RequestParam Integer playerNo, @RequestParam Integer targetNo) {
        gameService.validatePhase(roomId, GamePhase.NIGHT_ACTION);
        gameService.healPlayer(roomId, playerNo, targetNo);
        return ResponseEntity.ok(
            new BaseResponse<>("User " + targetNo + " healed in Room " + roomId + "."));
    }

    @GetMapping("/{roomId}/isEnd")
    @Operation(summary = "Check game over", description = "게임이 끝났는지 확인합니다.")
    public ResponseEntity<BaseResponse<STATUS>> isEnd(@PathVariable Long roomId) {
        STATUS status = gameService.isEnd(roomId);
        if (status != STATUS.PLAYING) {
            /*
             * 게임 로그 저장 기능 구현하기
             * */
            gameService.deleteGame(roomId);
        }
        return ResponseEntity.ok(new BaseResponse<>(status));
    }

    @GetMapping("/{roomId}/status")
    @Operation(summary = "Check game status", description = "게임의 현재 상태와 남은 시간을 확인합니다.")
    public ResponseEntity<BaseResponse<?>> getStatus(@PathVariable long roomId) {
        GamePhase phase = gameService.getPhase(roomId);
        Long Time = gameService.getTime(roomId);

        Map<String, Object> response = new HashMap<>();
        response.put("currentphase", phase);
        response.put("remainingtime", Time);

        return ResponseEntity.ok(new BaseResponse<>(response));
    }
}
