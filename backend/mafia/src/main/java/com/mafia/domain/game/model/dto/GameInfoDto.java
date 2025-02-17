package com.mafia.domain.game.model.dto;

import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.model.game.GAMESTATUS;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GameInfoDto {
    @Schema(description = "게임 방 ID", example = "12345")
    private final long gameId;

    @Schema(description = "게임에 참여한 플레이어 정보", example =
        "{101: {\"name\": \"Player1\"}, 102: {\"name\": \"Player2\"}}")
    private final Map<Integer, PlayerInfo> playersInfo; // 게임의 플레이어들을 담당하는 정보

    @Schema(description = "게임의 현재 상태", example = "STARTED",
        allowableValues = {"PLAYING", "CITIZEN_WIN", "ZOMBIE_WIN", "MUTANT_WIN"})
    private final GAMESTATUS GAMESTATUS;

    @Schema(description = "인게임 내 정보")
    private final MyInfo myInfo; // 나만의 개인정보


    public GameInfoDto(Long memberId, Game game){
        this.gameId = game.getGameId();
        playersInfo = new HashMap<>();
        Map<Long, Player> players = game.getPlayers();
        Map<Integer, Long> map = game.getMap_players();
        for(int i = 1; i<= players.size(); i++){
            if(map.get(i) == null) continue;
            Player player = players.get(map.get(i));
            PlayerInfo playerInfo = new PlayerInfo();
            playerInfo.setPlayerNo(i);
            playerInfo.setNickname(player.getNickName());
            playerInfo.setDead(player.isDead());
            playersInfo.put(i, playerInfo);
        }
        this.GAMESTATUS = game.getGamestatus();
        this.myInfo = new MyInfo(game.getPlayerNoByMemberId(memberId), players.get(memberId));
    }
}


