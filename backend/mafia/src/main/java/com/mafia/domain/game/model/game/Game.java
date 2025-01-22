package com.mafia.domain.game.model.game;

import com.mafia.domain.game.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Data
@AllArgsConstructor
@Slf4j
public class Game {

    private static final long serialVersionUID = 1L;

    private long roomId;
    private Map<Long, Player> players;
    private Map<Long, Long> votes;
    private Set<Long> ready;
    private Set<Long> deadplayers;
    private STATUS status;
    private int alive;
    private int dead;
    private int citizen;
    private int zombie;
    private int mutant;
    private int doctorCount;
    private Long healTarget;
    private GameOption option;

    public Game(){
        players = new HashMap<>();
        votes = new HashMap<>();
        ready = new HashSet<>();
        deadplayers = new HashSet<>();
        alive = 0;
        dead = 0;
        citizen = 0;
        zombie = 0;
        mutant = 0;
        this.option = new GameOption();
        doctorCount = this.option.getDoctorCount();
    }

    public void init(){
        players.clear();
        ready.clear();
        votes.clear();
        deadplayers.clear();
        alive = 0;
        dead = 0;
        zombie = 0;
        mutant = 0;
    }

    /*
    * 플레이어 추가
    * - 게임에 참가할 플레이어를 추가한다.
    * */
    public void addPlayer(User user){
        if(players.containsKey(user.getId())){
            log.info("[Game{}] User {} is already in the game", roomId, user.getId());
            return;
        }
        Player p = new Player(user);
        players.put(user.getId(), p);
    }

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

    public void start_game(){
        this.status = STATUS.PLAYING;
        // 1. 직업 분배
        List<Role> role = new ArrayList<>();
        init_role(role);
        int rcnt = 0;
        for(Map.Entry<Long, Player> e : players.entrySet()){
            Role user_role = role.get(rcnt);
            e.getValue().setRole(user_role);
            if(user_role == Role.MUTANT){
                e.getValue().setEnableVote(false);
            }
            rcnt++;
        }
        log.info("[Game{}] Role distribution is completed", roomId);
    }

    public void init_role(List<Role> role){
        this.zombie = option.getZombie();
        this.mutant = option.getMutant();
        this.alive = players.size();
        for(int i = 0; i < this.zombie; i++){
            role.add(Role.ZOMBIE);
        }
        if(this.mutant > 0 && Math.random() < 0.5){
            role.add(Role.MUTANT);
        } else this.mutant = 0;
        role.add(Role.POLICE);
        role.add(Role.PLAGUE_DOCTOR);
        this.citizen = this.alive - role.size();
        for(int i = 0; i < this.citizen; i++){
            role.add(Role.CITIZEN);
        }
        Collections.shuffle(role);
    }

    public void vote(Long user_id, Long target_id){
        votes.put(user_id, target_id);
    }

    public void voteClear(){
        votes.clear();
    }

    public Long voteResult(){
        Map<Long, Integer> result = new HashMap<>();
        votes.forEach((user, target) -> result.merge(target, 1, Integer::sum));

        Long target = result.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(-1L);

        return target;
    }

    public boolean kill(Long user_id){
        Player p = players.get(user_id);
        if(user_id.equals(healTarget)){
            healTarget = -1L;
            log.info("[Game{}] Doctor prevented the death of user {}.", roomId, user_id);
            return false;
        }
        p.setDead(true);
        alive--;
        dead++;
        switch (p.getRole()) {
            case ZOMBIE -> zombie--;
            case MUTANT -> mutant--;
            default -> citizen--;
        }
        return true;
    }

    public void heal(Long target_id){
        healTarget = target_id;
        if(doctorCount > 0) doctorCount--;
    }

    public Role findRole(Long user_id, Long target_id){
        Role find = players.get(target_id).getRole();
        if (find == Role.ZOMBIE) {
            players.get(target_id).setEnableVote(false);
            return Role.ZOMBIE;
        }
        else return Role.CITIZEN;

    }

    public int isGameOver(){
        if(zombie == 0 && mutant == 0){
            this.status = STATUS.CITIZEN_WIN;
            return 1; // 시민 승리
        }
        else if(mutant == 0 && zombie >= citizen){
            this.status = STATUS.ZOMBIE_WIN;
            return 2; // 좀비 승리
        }
        else if(mutant == 1 && citizen + zombie <= mutant){
            this.status = STATUS.MUTANT_WIN;
            return 3; // 돌연변이 승리
        }
        else{
            log.info("[Game{}] Game is still in progress", roomId);
            return 0; // 게임 진행중
        }
    }

    //public boolean findRole(){}
}
