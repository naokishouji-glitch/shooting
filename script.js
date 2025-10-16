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

    // Game settings
    let score = 0;
    let lives = 3;
    let gameRunning = true;

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
        rows: 4,
        cols: 8,
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
        for (let c = 0; c < enemyInfo.cols; c++) {
            for (let r = 0; r < enemyInfo.rows; r++) {
                enemies.push({
                    x: c * (enemyInfo.width + enemyInfo.padding) + enemyInfo.offsetX,
                    y: r * (enemyInfo.height + enemyInfo.padding) + enemyInfo.offsetY,
                    width: enemyInfo.width,
                    height: enemyInfo.height,
                    alive: true
                });
            }
        }
    }

    // --- Draw Functions ---
    function drawPlayer() {
        ctx.fillStyle = '#0f0'; // Green
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawEnemies() {
        ctx.fillStyle = '#f0f'; // Magenta
        enemies.forEach(enemy => {
            if (enemy.alive) {
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
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

        // Wall detection
        if (player.x < 0) {
            player.x = 0;
        }
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }
    }

    function moveBullets() {
        // Player bullets
        playerBullets.forEach((b, index) => {
            b.y -= bullet.speed;
            if (b.y + bullet.height < 0) {
                playerBullets.splice(index, 1);
            }
        });

        // Enemy bullets
        enemyBullets.forEach((b, index) => {
            b.y += bullet.speed;
            if (b.y > canvas.height) {
                enemyBullets.splice(index, 1);
            }
        });
    }

    function moveEnemies() {
        let hitWall = false;
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.x += enemyDirection * enemyInfo.speed;
                if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
                    hitWall = true;
                }
            }
        });

        if (hitWall) {
            enemyDirection *= -1;
            enemies.forEach(enemy => {
                enemy.y += enemyInfo.height;
            });
        }
    }

    function enemyShoot() {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0 && Math.random() < 0.02) { // Adjust probability for more/less frequent shots
            const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({
                x: shooter.x + shooter.width / 2 - bullet.width / 2,
                y: shooter.y + shooter.height
            });
        }
    }

    // --- Collision Detection ---
    function detectCollisions() {
        // Player bullets vs Enemies
        playerBullets.forEach((b, bIndex) => {
            enemies.forEach(enemy => {
                if (enemy.alive &&
                    b.x < enemy.x + enemy.width &&
                    b.x + bullet.width > enemy.x &&
                    b.y < enemy.y + enemy.height &&
                    b.y + bullet.height > enemy.y) {
                    enemy.alive = false;
                    playerBullets.splice(bIndex, 1);
                    score += 10;
                    updateUI();
                }
            });
        });

        // Enemy bullets vs Player
        enemyBullets.forEach((b, bIndex) => {
            if (b.x < player.x + player.width &&
                b.x + bullet.width > player.x &&
                b.y < player.y + player.height &&
                b.y + bullet.height > player.y) {
                enemyBullets.splice(bIndex, 1);
                lives--;
                updateUI();
                if (lives <= 0) {
                    gameOver();
                }
            }
        });

        // Enemies vs Player
        enemies.forEach(enemy => {
            if (enemy.alive &&
                enemy.x < player.x + player.width &&
                enemy.x + enemy.width > player.x &&
                enemy.y < player.y + player.height &&
                enemy.y + enemy.height > player.y) {
                gameOver();
            }
            // Enemies reach bottom
            if (enemy.alive && enemy.y + enemy.height > canvas.height) {
                gameOver();
            }
        });
    }

    // --- Game State Functions ---
    function updateUI() {
        scoreEl.innerText = score;
        livesEl.innerText = lives;
    }

    function checkWinCondition() {
        const allDead = enemies.every(e => !e.alive);
        if (allDead) {
            gameClear();
        }
    }

    function gameOver() {
        gameRunning = false;
        gameOverEl.classList.remove('hidden');
    }

    function gameClear() {
        gameRunning = false;
        gameClearEl.classList.remove('hidden');
    }

    function restartGame() {
        gameOverEl.classList.add('hidden');
        gameClearEl.classList.add('hidden');
        score = 0;
        lives = 3;
        player.x = canvas.width / 2 - 25;
        playerBullets = [];
        enemyBullets = [];
        enemyDirection = 1;
        createEnemies();
        updateUI();
        gameRunning = true;
        gameLoop();
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (!gameRunning) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw
        drawPlayer();
        drawEnemies();
        drawBullets();

        // Move
        movePlayer();
        moveBullets();
        moveEnemies();
        enemyShoot();

        // Collide
        detectCollisions();

        // Check win
        checkWinCondition();

        requestAnimationFrame(gameLoop);
    }

    // --- Event Handlers ---
    function keyDown(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right') {
            player.dx = player.speed;
        } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
            player.dx = -player.speed;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault(); // Prevent screen scrolling
            if (canShoot) {
                playerBullets.push({
                    x: player.x + player.width / 2 - bullet.width / 2,
                    y: player.y
                });
                canShoot = false; // Prevent holding down spacebar
            }
        }
    }

    function keyUp(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'ArrowLeft' || e.key === 'Left') {
            player.dx = 0;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            canShoot = true;
        }
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
