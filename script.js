document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // DOM Elements
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const gameOverEl = document.getElementById('game-over');
    const gameClearEl = document.getElementById('game-clear');
    const restartButton = document.getElementById('restart-button');
    const restartButtonClear = document.getElementById('restart-button-clear');
    const bossHealthContainer = document.getElementById('boss-health-container');
    const bossHealthBar = document.getElementById('boss-health-bar-inner');


    // Game settings
    let score = 0;
    let lives = 3;
    let gameRunning = true;
    let currentStage = 1;
    const maxStage = 3;

    // Player
    const player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 30,
        speed: 5,
        dx: 0
    };

    // Bullets
    const bullet = {
        width: 5,
        height: 15,
        speed: 7
    };
    let playerBullets = [];
    let enemyBullets = [];
    let canShoot = true;

    // Enemies
    const enemyInfo = {
        width: 40,
        height: 30,
        padding: 20,
        offsetX: 60,
        offsetY: 50,
        speed: 2
    };
    let enemies = [];
    let enemyDirection = 1;

    // --- Create Functions ---
    function createEnemies() {
        enemies = [];
        bossHealthContainer.classList.add('hidden');

        if (currentStage < maxStage) {
            const rows = 2 + currentStage; // ステージが進むと敵が増える
            const cols = 7 + currentStage;
            enemyInfo.speed = 1 + currentStage; // 敵が速くなる

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    enemies.push({
                        x: c * (enemyInfo.width + enemyInfo.padding) + enemyInfo.offsetX,
                        y: r * (enemyInfo.height + enemyInfo.padding) + enemyInfo.offsetY,
                        width: enemyInfo.width,
                        height: enemyInfo.height,
                        alive: true
                    });
                }
            }
        } else {
            createBoss();
        }
    }

    function createBoss() {
        enemies.push({
            x: canvas.width / 2 - 75,
            y: 50,
            width: 150,
            height: 100,
            alive: true,
            isBoss: true,
            health: 20,
            maxHealth: 20,
            speed: 1.5
        });
        bossHealthContainer.classList.remove('hidden');
        updateBossHealthBar();
    }

    // --- Draw Functions ---
    function drawPlayer() {
        ctx.fillStyle = '#0f0'; // Green
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawEnemies() {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                if (enemy.isBoss) {
                    ctx.font = '80px sans-serif';
                    ctx.fillText('👹', enemy.x, enemy.y + enemy.height - 20);
                } else {
                    ctx.font = '30px sans-serif';
                    ctx.fillText('👻', enemy.x, enemy.y + enemy.height - 5);
                }
            }
        });
    }

    function drawBullets() {
        ctx.fillStyle = '#ff0'; // Yellow
        playerBullets.forEach(b => {
            ctx.fillRect(b.x, b.y, bullet.width, bullet.height);
        });

        ctx.fillStyle = '#0ff'; // Cyan
        enemyBullets.forEach(b => {
            ctx.fillRect(b.x, b.y, bullet.width, bullet.height);
        });
    }

    // --- Move and Update Functions ---
    function movePlayer() {
        player.x += player.dx;

        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }

    function moveBullets() {
        playerBullets.forEach((b, i) => {
            b.y -= bullet.speed;
            if (b.y + bullet.height < 0) playerBullets.splice(i, 1);
        });
        enemyBullets.forEach((b, i) => {
            b.y += bullet.speed;
            if (b.y > canvas.height) enemyBullets.splice(i, 1);
        });
    }

    function moveEnemies() {
        let hitWall = false;
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.x += enemyDirection * (enemy.isBoss ? enemy.speed : enemyInfo.speed);
                if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
                    hitWall = true;
                }
            }
        });

        if (hitWall) {
            enemyDirection *= -1;
            enemies.forEach(e => { e.y += e.isBoss ? 20 : enemyInfo.height; });
        }
    }

    function enemyShoot() {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
            const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            let shootProbability = shooter.isBoss ? 0.05 : 0.02;

            if (Math.random() < shootProbability) {
                enemyBullets.push({
                    x: shooter.x + shooter.width / 2 - bullet.width / 2,
                    y: shooter.y + shooter.height
                });
            }
        }
    }

    // --- Collision Detection ---
    function detectCollisions() {
        playerBullets.forEach((b, bIndex) => {
            enemies.forEach(enemy => {
                if (enemy.alive && b.x < enemy.x + enemy.width && b.x + bullet.width > enemy.x && b.y < enemy.y + enemy.height && b.y + bullet.height > enemy.y) {
                    if (enemy.isBoss) {
                        enemy.health--;
                        updateBossHealthBar();
                        if (enemy.health <= 0) {
                            enemy.alive = false;
                            score += 100;
                        }
                    } else {
                        enemy.alive = false;
                        score += 10;
                    }
                    playerBullets.splice(bIndex, 1);
                    updateUI();
                }
            });
        });

        enemyBullets.forEach((b, bIndex) => {
            if (b.x < player.x + player.width && b.x + bullet.width > player.x && b.y < player.y + player.height && b.y + bullet.height > player.y) {
                enemyBullets.splice(bIndex, 1);
                lives--;
                updateUI();
                if (lives <= 0) gameOver();
            }
        });

        enemies.forEach(enemy => {
            if (enemy.alive && enemy.x < player.x + player.width && enemy.x + enemy.width > player.x && enemy.y < player.y + player.height && enemy.y + enemy.height > player.y) {
                gameOver();
            }
            if (enemy.alive && !enemy.isBoss && enemy.y + enemy.height > canvas.height) {
                gameOver();
            }
        });
    }

    // --- Game State Functions ---
    function updateUI() {
        scoreEl.innerText = score;
        livesEl.innerText = lives;
    }

    function updateBossHealthBar() {
        const boss = enemies.find(e => e.isBoss);
        if (boss) {
            const healthPercentage = (boss.health / boss.maxHealth) * 100;
            bossHealthBar.style.width = healthPercentage + '%';
        }
    }

    function checkWinCondition() {
        if (enemies.length === 0) return;
        const allDead = enemies.every(e => !e.alive);
        if (allDead) {
            if (currentStage < maxStage) {
                currentStage++;
                gameRunning = false; // 一時停止
                setTimeout(() => {
                    createEnemies();
                    gameRunning = true;
                    gameLoop();
                }, 2000); // 次のステージまで2秒待つ
            } else {
                gameClear();
            }
        }
    }

    function gameOver() {
        gameRunning = false;
        gameOverEl.classList.remove('hidden');
    }

    function gameClear() {
        gameRunning = false;
        bossHealthContainer.classList.add('hidden');
        gameClearEl.classList.remove('hidden');
    }

    function restartGame() {
        gameOverEl.classList.add('hidden');
        gameClearEl.classList.add('hidden');
        score = 0;
        lives = 3;
        currentStage = 1;
        player.x = canvas.width / 2 - 25;
        playerBullets = [];
        enemyBullets = [];
        enemyDirection = 1;
        createEnemies();
        updateUI();
        if (!gameRunning) {
            gameRunning = true;
            gameLoop();
        }
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawEnemies();
        drawBullets();
        movePlayer();
        moveBullets();
        moveEnemies();
        enemyShoot();
        detectCollisions();
        checkWinCondition();

        requestAnimationFrame(gameLoop);
    }

    // --- Event Handlers ---
    function keyDown(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right') player.dx = player.speed;
        else if (e.key === 'ArrowLeft' || e.key === 'Left') player.dx = -player.speed;
        else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (canShoot) {
                playerBullets.push({ x: player.x + player.width / 2 - bullet.width / 2, y: player.y });
                canShoot = false;
            }
        }
    }

    function keyUp(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'ArrowLeft' || e.key === 'Left') player.dx = 0;
        else if (e.key === ' ' || e.key === 'Spacebar') canShoot = true;
    }

    // --- Initial Setup ---
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
    restartButton.addEventListener('click', restartGame);
    restartButtonClear.addEventListener('click', restartGame);

    createEnemies();
    updateUI();
    gameLoop();
});