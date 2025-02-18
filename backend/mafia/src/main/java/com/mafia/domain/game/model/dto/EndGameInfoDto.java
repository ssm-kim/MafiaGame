package com.mafia.domain.game.model.dto;

import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.GameStatus;
import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.model.game.Role;
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
            boolean isWin;
            if(game.getGameStatus() == GameStatus.ZOMBIE_WIN && player.getRole() == Role.ZOMBIE){
                isWin = true;
            } else if(game.getGameStatus() == GameStatus.MUTANT_WIN && player.getRole() == Role.MUTANT){
                isWin = true;
            } else {
                isWin = game.getGameStatus() == GameStatus.CITIZEN_WIN &&
                    player.getRole() != Role.MUTANT && player.getRole() != Role.ZOMBIE;
            }

            EndPlayer ep = new EndPlayer(game.getPlayerNoByMemberId(player.getMemberId()), player, isWin);
            endPlayers.add(ep);
        }
    }
}
