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

        console.log(`현재 역할: ${role}`);
        console.log(`타겟 플레이어: `, targetPlayer.playerData);

        switch(role) {
            case '감염자':
                this.infectPlayer(targetPlayer);
                break;
            case '연구원':
                this.investigatePlayer(targetPlayer);
                break;
            case '의사':
                this.healPlayer(targetPlayer);
                break;
            case '돌연변이':
                this.mutatePlayer(targetPlayer);
                break;
        }
    }

    async infectPlayer(target) {
        console.log('감염자 스킬 사용 시도');
        this.skillUsed = true;
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.cameras.main.flash(300, 255, 0, 0);

        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('감염자 스킬 응답:', response);
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            }
        } catch (e) {
            console.error('감염자 스킬 사용 실패:', e);
        }
    }

    async mutatePlayer(target) {
        console.log('돌연변이 스킬 사용 시도');
        this.skillUsed = true;
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.cameras.main.flash(300, 255, 0, 0);

        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('돌연변이 스킬 응답:', response);
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            }
        } catch (e) {
            console.error('돌연변이 스킬 사용 실패:', e);
        }
    }

    async investigatePlayer(target) {
        console.log('연구원 스킬 사용 시도');
        this.skillUsed = true;
    
        try {
            // targetId를 targetNo로 변경
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('연구원 스킬 응답:', response);
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            }
        } catch (e) {
            console.error('연구원 스킬 사용 실패:', e);
        }
    }

    // async investigatePlayer(target) {
    //     console.log('연구원 스킬 사용 시도');
    //     this.skillUsed = true;
        
    //     this.socketService.stompClient.send(
    //         `/app/game/${this.roomId}/investigate`,
    //         {},
    //         JSON.stringify({ targetId: target.playerData.memberId })
    //     );

    //     try {
    //         const target = 2
    //         const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetId=${target}`)
    //         console.log(response)
    //     } catch (e) {
    //         console.error(e)
    //     }
        

    //     this.socketService.stompClient.subscribe(
    //         `/topic/game/${this.roomId}/investigate-result`,
    //         (response) => {
    //             const result = JSON.parse(response.body);
    //             console.log('연구원 스킬 응답', result);
    //             if (result.isSuccess) {
    //                 this.showSkillResult(result.result.ex);
    //             }
    //         }
    //     );
    // }

    async healPlayer(target) {
        console.log('의사 스킬 사용 시도');
        this.skillUsed = true;

        try {
            const response = await api.post(`http://localhost:8080/api/game/${this.roomId}/target/set?targetNo=${target.playerData.memberId}`);
            console.log('의사 스킬 응답:', response);
            if (response.data.isSuccess) {
                this.showSkillResult(response.data.result.ex);
            }
        } catch (e) {
            console.error('의사 스킬 사용 실패:', e);
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
