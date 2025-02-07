package com.mafia.domain.game.model.game;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mafia.domain.room.model.redis.Participant;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
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
    private Map<Long, Player> players;

    @Schema(description = "플레이어들의 투표 정보", example = "{101: 102, 103: 104}")
    private Map<Long, Long> votes;

    @Schema(description = "게임의 현재 상태", example = "STARTED",
        allowableValues = {"PLAYING", "CITIZEN_WIN", "ZOMBIE_WIN", "MUTANT_WIN"})
    private STATUS status;

    @Schema(description = "현재 라운드에서 의사가 치료 대상으로 지정한 플레이어의 ID", example = "101")
    private Long healTarget;

    @Schema(description = "현재 라운드에서 좀비가 공격 대상으로 지정한 플레이어의 ID", example = "102")
    private Long zTarget;

    @Schema(description = "현재 라운드에서 변종이 공격 대상으로 지정한 플레이어의 ID", example = "102")
    private Long mTarget;

    @Schema(description = "게임 옵션")
    private GameOption setting;

    // @PostConstruct <- 이후 알아봄
    public Game(long roomId, GameOption setting) {
        this.gameId = roomId;
        this.players = new HashMap<>();
        this.votes = new ConcurrentHashMap<>();
        this.healTarget = null;
        this.zTarget = null;
        this.mTarget = null;
        this.setting = setting; // <- POST CONSTRUCT
    }

    /*
     * 플레이어 추가
     * - 게임에 참가할 플레이어를 추가한다.
     * */
    public void addPlayer(Participant participant) {
        for (Player p : players.values()) {
            if (p.getMemberId().equals(participant.getMemberId())) {
                log.info("[Game{}] User {} is already in the game", gameId,
                    participant.getMemberId());
                return;
            }
        }
        Player player = new Player(participant);
        players.put(participant.getMemberId(), player);
    }

    public void startGame() {
        this.status = STATUS.PLAYING;
        // 1. 직업 분배
        List<Role> role = new ArrayList<>();
        init_role(role);
        int rcnt = 0;
        for (Map.Entry<Long, Player> entry : players.entrySet()) {
            Player player = entry.getValue();
            Role userRole = role.get(rcnt);

            player.setRole(userRole);
            player.subscribe("game-" + gameId + "-day-chat");

            if (userRole == Role.ZOMBIE) {
                player.subscribe("game-" + gameId + "-night-chat");
            }

            if (userRole == Role.MUTANT) {
                player.setEnableVote(false);
            }
            rcnt++;
        }
        log.info("[Game{}] Role distribution is completed", gameId);
    }

    public void init_role(List<Role> role) {
        for (int i = 0; i < setting.getZombie(); i++) {
            role.add(Role.ZOMBIE);
        }
        if (setting.getMutant() > 0 && Math.random() < 0.5) {
            role.add(Role.MUTANT);
        } else {
            setting.setMutant(0);
        }
        role.add(Role.POLICE);
        role.add(Role.PLAGUE_DOCTOR);
        int citizen = players.size() - role.size();
        for (int i = 0; i < citizen; i++) {
            role.add(Role.CITIZEN);
        }
        Collections.shuffle(role);
    }

    public void vote(Long playerNo, Long targetNo) {
        votes.put(playerNo, targetNo);
    }

    public Long voteResult() {
        Map<Long, Long> result = new HashMap<>();
        votes.forEach((user, target) -> result.merge(target, 1L, Long::sum));
        long rtn = result.entrySet().stream().max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey).orElse(-1L);
        votes.clear();

        return rtn;
    }

    public void Kill(Long targetNo) {
        Player p = players.get(targetNo);
        p.setDead(true);
        p.updateSubscriptionsOnDeath(gameId);
        isGameOver();
    }

    public boolean processRoundResults() { // 밤중 킬
        if (zTarget == null && mTarget == null) {
            return false; // 죽일 대상이 없으면 바로 종료
        }

        // 치료된 플레이어 제외
        List<Long> finalDeathList = new ArrayList<>();
        finalDeathList.add(zTarget);
        finalDeathList.add(mTarget);
        if (healTarget != null) {  // 유효한 healTarget만 제거
            finalDeathList.remove(healTarget);
        }

        // 실제 킬 처리
        for (Long target : finalDeathList) {
            Kill(target);
        }

        // 라운드가 끝나면 리스트 초기화
        healTarget = null;
        zTarget = null;
        mTarget = null;

        return true;
    }

    public void heal(Long targetNo) {
        healTarget = targetNo;
        int cnt = setting.getDoctorSkillUsage();
        if (cnt > 0) {
            setting.setDoctorSkillUsage(cnt - 1);
        }
    }

    public void setKillTarget(Long playerNo, Long targetNo) {
        if(players.get(playerNo).getRole() == Role.ZOMBIE) zTarget = targetNo;
        else if(players.get(playerNo).getRole() == Role.MUTANT) mTarget = targetNo;
    }

    public Role findRole(Long playerNo, Long targetNo) {
        Role find = players.get(targetNo).getRole();
        if (find == Role.ZOMBIE) {
            players.get(playerNo).setEnableVote(false);
            return Role.ZOMBIE;
        } else {
            return Role.CITIZEN;
        }
    }

    private void isGameOver() {
        //각 역할별 생존자 수 계산
        long citizen = players.values().stream()
            .filter(player -> player.getRole() == Role.CITIZEN && !player.isDead())
            .count();
        long zombie = players.values().stream()
            .filter(player -> player.getRole() == Role.ZOMBIE && !player.isDead())
            .count();
        long mutant = players.values().stream()
            .filter(player -> player.getRole() == Role.MUTANT && !player.isDead())
            .count();

        if (zombie == 0 && mutant == 0) {
            this.status = STATUS.CITIZEN_WIN;
        } else if (mutant == 0 && zombie >= citizen) {
            this.status = STATUS.ZOMBIE_WIN;
        } else if (mutant > 0 && citizen + zombie <= mutant) {
            this.status = STATUS.MUTANT_WIN;
        } else {
            log.info("[Game{}] Game is still in progress", gameId);
        }

        if (this.status != STATUS.PLAYING) {
            log.info("[Game{}] Game over with status: {}", gameId, this.status);
        }
    }
}
