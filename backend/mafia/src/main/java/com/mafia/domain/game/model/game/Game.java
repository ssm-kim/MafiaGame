package com.mafia.domain.game.model.game;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mafia.domain.room.model.redis.Participant;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.concurrent.ConcurrentHashMap;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Getter @Setter
@NoArgsConstructor
@Slf4j
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "게임의 상태와 관련된 정보를 포함하는 클래스")
public class Game implements Serializable { // 필드정리

    private static final long serialVersionUID = 1L;

    @Schema(description = "게임 방 ID", example = "12345")
    @JsonProperty("game_id")
    private long gameId;

    @Schema(description = "게임에 참여한 플레이어 정보", example =
        "{101: {\"name\": \"Player1\"}, 102: {\"name\": \"Player2\"}}")
    private Map<Integer, Player> players;

    @Schema(description = "플레이어들의 투표 정보", example = "{101: 102, 103: 104}")
    private Map<Integer, Integer> votes;

    @Schema(description = "죽은 플레이어들의 ID 목록", example = "[105, 106]")
    private Set<Integer> deadPlayers; // 메서드로 뺴보기

    @Schema(description = "게임의 현재 상태", example = "STARTED",
        allowableValues = {"PLAYING", "CITIZEN_WIN", "ZOMBIE_WIN", "MUTANT_WIN"})
    private STATUS status;

    @Schema(description = "현재 생존한 플레이어 수", example = "8")
    private int alive;

    @Schema(description = "현재 죽은 플레이어 수", example = "2")
    private int dead;

    @Schema(description = "생존한 시민의 수", example = "3")
    private int citizen;

    @Schema(description = "생존한 좀비의 수", example = "1")
    private int zombie;

    @Schema(description = "생존한 돌연변이의 수", example = "1")
    private int mutant;

    @Schema(description = "현재 라운드에서 의사가 치료 대상으로 지정한 플레이어의 ID", example = "101")
    private Integer healTarget;

    @Schema(description = "현재 라운드에서 변종이 공격 대상으로 지정한 플레이어의 ID", example = "102")
    private Integer mutantTarget;

    @Schema(description = "현재 라운드에서 좀비들이 공격 대상으로 지정한 플레이어의 ID", example = "103")
    private Integer zombieTarget;

    @Schema(description = "게임 옵션")
    private GameOption option;
// @PostConstruct <- 이후 알아봄
    public Game(long roomId, GameOption option) {
        this.gameId = roomId;
        this.players = new HashMap<>();
        this.votes = new ConcurrentHashMap<>();
        this.deadPlayers = new HashSet<>();
        this.alive = 0;
        this.dead = 0;
        this.citizen = 0;
        this.zombie = 0;
        this.mutant = 0;
        this.healTarget = 0;
        this.mutantTarget = 0;
        this.zombieTarget = 0;
        this.option = option; // <- POST CONSTRUCT
    }

    /*
     * 플레이어 추가
     * - 게임에 참가할 플레이어를 추가한다.
     * */
    public void addPlayer(Participant participant) {
        for (Player p : players.values()) {
            if (p.getMemberId().equals(participant.getMemberId())) {
                log.info("[Game{}] User {} is already in the game", gameId, participant.getMemberId());
                return;
            }
        }
        Player player = new Player(participant);
        players.put(++alive, player);
    }

    public void startGame() {
        this.status = STATUS.PLAYING;
        // 1. 직업 분배
        List<Role> role = new ArrayList<>();
        init_role(role);
        int rcnt = 0;
        for (Map.Entry<Integer, Player> e : players.entrySet()) {
            Role user_role = role.get(rcnt);
            e.getValue().setRole(user_role);
            if (user_role == Role.MUTANT) {
                e.getValue().setEnableVote(false);
            }
            rcnt++;
        }
        log.info("[Game{}] Role distribution is completed", gameId);
    }

    public void init_role(List<Role> role) {
        this.zombie = option.getZombie();
        this.mutant = option.getMutant();
        for (int i = 0; i < this.zombie; i++) {
            role.add(Role.ZOMBIE);
        }
        if (this.mutant > 0 && Math.random() < 0.5) {
            role.add(Role.MUTANT);
        } else {
            this.mutant = 0;
        }
        role.add(Role.POLICE);
        role.add(Role.PLAGUE_DOCTOR);
        this.citizen = this.alive - role.size();
        for (int i = 0; i < this.citizen; i++) {
            role.add(Role.CITIZEN);
        }
        this.citizen = this.alive - this.zombie - this.mutant;
        Collections.shuffle(role);
    }

    public void vote(Integer playerNo, Integer targetNo) {
        votes.put(playerNo, targetNo);
    }

    public Integer voteResult() {
        Map<Integer, Integer> result = new HashMap<>();
        votes.forEach((user, target) -> result.merge(target, 1, Integer::sum));

        return result.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(-1);
    }

    public void Kill(Integer targetNo) {
        Player p = players.get(targetNo);
        p.setDead(true);
        deadPlayers.add(targetNo);
        alive--;
        dead++;
        switch (p.getRole()) {
            case ZOMBIE -> zombie--;
            case MUTANT -> mutant--;
            default -> citizen--;
        }
        isGameOver();
    }

    public boolean processKill() {
        List<Integer> result = new ArrayList<>();
        if (zombieTarget.equals(healTarget)) {
            result.add(zombieTarget);
        }
        if (mutantTarget.equals(healTarget)) {
            result.add(mutantTarget);
        }

        if (result.isEmpty()) {
            log.info("[Game{}] No one is killed", gameId);
            return false;
        }
        for (Integer targetNo : result) {
            Kill(targetNo);
        }
        healTarget = -1;
        return true;
    }

    public void heal(Integer targetNo) {
        healTarget = targetNo;
        int cnt = option.getDoctorSkillUsage();
        if (cnt > 0) {
            option.setDoctorSkillUsage(cnt--);
        }
    }

    public void zombieTarget(Integer targetNo) {
        zombieTarget = targetNo;
    }

    public void mutantTarget(Integer targetNo) {
        mutantTarget = targetNo;
    }

    public Role findRole(Integer playerNo, Integer targetNo) {
        Role find = players.get(targetNo).getRole();
        if (find == Role.ZOMBIE) {
            players.get(playerNo).setEnableVote(false);
            return Role.ZOMBIE;
        } else {
            return Role.CITIZEN;
        }
    }

    private void isGameOver() {
        if (zombie == 0 && mutant == 0) {
            this.status = STATUS.CITIZEN_WIN;
        } else if (mutant == 0 && zombie >= citizen) {
            this.status = STATUS.ZOMBIE_WIN;
        } else if (mutant == 1 && citizen + zombie <= mutant) {
            this.status = STATUS.MUTANT_WIN;
        } else {
            log.info("[Game{}] Game is still in progress", gameId);
        }
    }
}
