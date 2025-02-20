export default class BGMController {
    constructor(scene) {
        this.scene = scene;
        this.bgm = null;
        this.isMuted = false;
    
        // 이전 BGM 정리
        if (this.scene.registry.get('currentBGM')) {
            const prevBGM = this.scene.registry.get('currentBGM');
            prevBGM.stop();
            this.scene.registry.remove('currentBGM');
        }
    
        // 사운드 시스템 설정
        this.scene.sound.pauseOnBlur = false;
        
        // 자동재생을 위한 설정
        this.scene.sound.unlock();  // 사운드 시스템 잠금 해제
        this.scene.sound.setMute(false);  // 음소거 해제
    
        this.createMuteButton();
    }
    
    createMuteButton() {
        try {
            const button = this.scene.add.text(20, 50, '🔊', {
                fontSize: '32px',
                backgroundColor: 'rgba(0,0,0,0.0)',
                padding: { x: 10, y: 10 }
            })
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);

            button.on('pointerdown', () => {
                this.toggleMute();
                button.setText(this.isMuted ? '🔇' : '🔊');
            });

            this.muteButton = button;
        } catch (error) {
            console.error('뮤트 버튼 생성 중 오류:', error);
        }
    }

    playBGM(key) {
        try {
            if (this.bgm) {
                this.bgm.stop();
            }
    
            // BGM 설정
            this.bgm = this.scene.sound.add(key, {
                volume: 0.3,
                loop: true
            });
    
            // registry에 현재 BGM 저장
            if (this.bgm) {
                this.scene.registry.set('currentBGM', this.bgm);
    
                // 즉시 재생 시도
                if (!this.isMuted) {
                    this.bgm.play();
                    
                    // 자동재생 보장을 위한 추가 처리
                    if (!this.bgm.isPlaying) {
                        this.scene.sound.once('unlocked', () => {
                            this.bgm?.play();
                        });
                    }
                }
            }
        } catch (error) {
            console.error('BGM 재생 중 오류:', error);
        }
    }
    
    toggleMute() {
        try {
            this.isMuted = !this.isMuted;
            if (this.bgm) {
                if (this.isMuted) {
                    this.bgm.pause();
                } else {
                    this.bgm.resume();
                }
            }
        } catch (error) {
            console.error('음소거 토글 중 오류:', error);
        }
    }

    stop() {
        try {
            if (this.bgm) {
                this.bgm.stop();
                this.bgm = null;
            }
            if (this.scene.registry) {
                this.scene.registry.remove('currentBGM');
            }
        } catch (error) {
            console.error('BGM 정지 중 오류:', error);
        }
    }
}
