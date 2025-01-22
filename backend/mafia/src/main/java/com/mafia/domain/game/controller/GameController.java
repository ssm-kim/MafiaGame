package com.mafia.domain.game.controller;

import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.service.GameService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@Tag(name = "Game Controller", description = "APIs for managing zombie game")

public class GameController {

    private final GameService gameService;

    @GetMapping("/{roomId}/start")
    @Operation(summary = "Start game", description = "Starts the game for the given room ID.")
    public ResponseEntity<String> startGame(@PathVariable Long roomId) {
        boolean started = gameService.startGame(roomId);
        if (started) {
            return ResponseEntity.ok("Game started in Room " + roomId + ".");
        }
        return ResponseEntity.badRequest().body("Not all players are ready.");
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "Get game", description = "Retrieves the game details for the given room ID.")
    public ResponseEntity<Game> getGame(@PathVariable Long roomId) {
        Game game = gameService.findById(roomId);
        if (game != null) {
            return ResponseEntity.ok(game);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{roomId}")
    @Operation(summary = "Delete game", description = "Deletes the game for the given room ID.")
    public ResponseEntity<String> deleteGame(@PathVariable Long roomId) {
        gameService.deleteGame(roomId);
        return ResponseEntity.ok("Room " + roomId + " deleted.");
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
    public ResponseEntity<String> vote(@PathVariable Long roomId, @RequestParam Long userId, @RequestParam Long targetId) {
        gameService.vote(roomId, userId, targetId);
        return ResponseEntity.ok("User " + userId + " voted for " + targetId + " in Room " + roomId + ".");
    }

    @GetMapping("/{roomId}/voteresult")
    @Operation(summary = "Get vote result", description = "Returns the result of the vote in the given room.")
    public ResponseEntity<Long> getVoteResult(@PathVariable Long roomId) {
        Long result = gameService.getVoteResult(roomId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{roomId}/clear/vote")
    @Operation(summary = "vote Init", description = "Reset the result of the vote in the given room.")
    public ResponseEntity<Long> resetVote(@PathVariable Long roomId) {
        Long result = gameService.getVoteResult(roomId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{roomId}/kill/{userId}")
    @Operation(summary = "Kill player", description = "Marks the specified user as killed in the given room.")
    public ResponseEntity<String> killPlayer(@PathVariable Long roomId, @PathVariable Long userId) {
        gameService.killPlayer(roomId, userId);
        return ResponseEntity.ok("User " + userId + " killed in Room " + roomId + ".");
    }

    @GetMapping("/{roomId}/status")
    @Operation(summary = "Check game over", description = "Checks if the game is over for the given room.")
    public ResponseEntity<Integer> checkGameOver(@PathVariable Long roomId) {
        int status = gameService.checkGameOver(roomId);
        return ResponseEntity.ok(status);
    }
}
