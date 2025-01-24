package com.mafia.domain.game.model.game;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mafia.domain.game.model.User;
import com.mafia.domain.member.model.entity.Member;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Data
@AllArgsConstructor
@Slf4j
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "게임의 상태와 관련된 정보를 포함하는 클래스")
public class Game {

    private static final long serialVersionUID = 1L;

    @Schema(description = "게임 방 ID", example = "12345")
    @JsonProperty("room_id")
    private long roomId;
    @Schema(description = "게임에 참여한 플레이어 정보", example =
        "{101: {\"name\": \"Player1\"}, 102: {\"name\": \"Player2\"}}")
    private Map<Integer, Player> players;
    @Schema(description = "플레이어들의 투표 정보", example = "{101: 102, 103: 104}")
    private Map<Integer, Integer> votes;
    @Schema(description = "죽은 플레이어들의 ID 목록", example = "[105, 106]")
    private Set<Integer> deadPlayers;
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
    @Schema(description = "의사 능력 사용 횟수", example = "2")
    private int doctorSkillUsage;
    @Schema(description = "현재 라운드에서 의사가 치료 대상으로 지정한 플레이어의 ID", example = "101")
    private Integer healTarget;
    @Schema(description = "현재 라운드에서 변종이 공격 대상으로 지정한 플레이어의 ID", example = "102")
    private Integer mutantTarget;
    @Schema(description = "현재 라운드에서 좀비들이 공격 대상으로 지정한 플레이어의 ID", example = "103")
    private Integer zombieTarget;
    @Schema(description = "게임 옵션")
    private GameOption option;

    public Game() {
        players = new HashMap<>();
        votes = new HashMap<>();
        deadPlayers = new HashSet<>();
        alive = 0;
        dead = 0;
        citizen = 0;
        zombie = 0;
        mutant = 0;
        healTarget = 0;
        mutantTarget = 0;
        zombieTarget = 0;
        this.option = new GameOption();
        doctorSkillUsage = this.option.getDoctorSkillUsage();
    }

    public void init() {
        players.clear();
        votes.clear();
        deadPlayers.clear();
        alive = 0;
        dead = 0;
        zombie = 0;
        mutant = 0;
        healTarget = 0;
        mutantTarget = 0;
        zombieTarget = 0;
    }

    /*
     * 플레이어 추가
     * - 게임에 참가할 플레이어를 추가한다.
     * */
    public void addPlayer(Member member) {
        for (Player p : players.values()) {
            if (p.getMemberId().equals(member.getMemberId())) {
                log.info("[Game{}] User {} is already in the game", roomId, member.getMemberId());
                return;
            }
        }
        Player player = new Player(member);
        players.put(++alive, player);
    }

    /*
        public int ready(Long user_id){
            if(ready.contains(user_id)){
                log.info("[Game{}] User {} is already ready", roomId, user_id);
                return -1;
            }
            ready.add(user_id);
  
            return ready.size();
        }
  
        public boolean isReady(){
            return ready.size() == players.size();
        }
  
        public int readyClear(){
            ready.clear();
            return 0;
        }
    */
    public void start_game() {
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
        log.info("[Game{}] Role distribution is completed", roomId);
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

    public void voteClear() {
        votes.clear();
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
            log.info("[Game{}] No one is killed", roomId);
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
        if (doctorSkillUsage > 0) {
            doctorSkillUsage--;
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
            log.info("[Game{}] Game is still in progress", roomId);
        }
    }
}
