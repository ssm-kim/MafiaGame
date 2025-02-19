import api from "@/api/axios";

// /game/skills/SkillManager.ts
export default class SkillManager {
    constructor(scene) {
        this.scene = scene;
        this.skillUsed = false;
        this.socketService = this.scene.socketService;
        this.roomId = this.scene.roomId
    }

    handleInteraction(targetPlayer) {
        if (this.skillUsed) return;
        
        const role = this.scene.playerInfo.role;
    
        console.log('상호작용 시도:');
        console.log(`- 현재 역할: ${role}`);
        console.log(`- 타겟 플레이어:`, targetPlayer.playerData);
        console.log(`- Room ID:`, this.roomId);
    
        switch(role) {
            case 'ZOMBIE':  // 백엔드에서 오는 그대로의 역할명 사용
                this.infectPlayer(targetPlayer);
                break;
            case 'RESEARCHER':
                this.investigatePlayer(targetPlayer);
                break;
            case 'DOCTOR':
                this.healPlayer(targetPlayer);
                break;
            case 'MUTANT':
                this.mutatePlayer(targetPlayer);
                break;
            default:
                console.error('알 수 없는 역할:', role);
        }
    }

    async infectPlayer(target) {
        console.log('감염자 스킬 사용 시도');
        console.log('대상 플레이어:', target.playerData);
        console.log('API 요청 URL:', `http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
    
        this.skillUsed = true;
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.cameras.main.flash(300, 255, 0, 0);
    
        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('API 응답:', response);
            
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            } else {
                console.error('API 요청 실패:', response.data);
            }
        } catch (e) {
            console.error('API 요청 중 오류:', e);
        }
    }

    async mutatePlayer(target) {
        console.log('돌연변이 스킬 사용 시도');
        console.log('대상 플레이어:', target.playerData);
        console.log('API 요청 URL:', `http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
    
        this.skillUsed = true;
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.cameras.main.flash(300, 255, 0, 0);
    
        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('API 응답:', response);
            
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            } else {
                console.error('API 요청 실패:', response.data);
            }
        } catch (e) {
            console.error('API 요청 중 오류:', e);
        }
    }
    
    async investigatePlayer(target) {
        console.log('연구원 스킬 사용 시도');
        console.log('대상 플레이어:', target.playerData);
        console.log('API 요청 URL:', `http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
    
        this.skillUsed = true;
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.cameras.main.flash(300, 255, 0, 0);
    
        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('API 응답:', response);
            
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            } else {
                console.error('API 요청 실패:', response.data);
            }
        } catch (e) {
            console.error('API 요청 중 오류:', e);
        }
    }
    
    async healPlayer(target) {
        console.log('의사 스킬 사용 시도');
        console.log('대상 플레이어:', target.playerData);
        console.log('API 요청 URL:', `http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
    
        this.skillUsed = true;
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.cameras.main.flash(300, 255, 0, 0);
    
        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('API 응답:', response);
            
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            } else {
                console.error('API 요청 실패:', response.data);
            }
        } catch (e) {
            console.error('API 요청 중 오류:', e);
        }
    }

    showSkillResult(message) {
        const resultText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            message,
            {
                fontSize: '24px',
                fill: '#00ff00',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 20, y: 10 },
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

        this.scene.time.delayedCall(2000, () => {
            resultText.destroy();
        });
    }
}
