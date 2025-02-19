package com.mafia.domain.game.model.dto;

import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.Player;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EndGameInfoDto {
    List<EndPlayer> endPlayers;

    public EndGameInfoDto(Game game) {
        List<Player> players = new ArrayList<>(game.getPlayers().values());
        endPlayers = new ArrayList<>();
        for(Player player : players){
            EndPlayer ep = new EndPlayer(game.getPlayerNoByMemberId(player.getMemberId()), player);
            endPlayers.add(ep);
        }
    }
}
