const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start';
let score = 0;
let killCount = 0;
let highScore = 0;

// Hero ball properties
const hero = {
    x: 120,
    y: 300,
    radius: 25,
    velocity: 0,
    gravity: 0.6,
    bounce: -10
};

// Bullets
const bullets = [];
const maxAmmo = 100;
let ammo = maxAmmo;
let ammoRegenTimer = 0;

// Scary villains
const villains = [];
const scaryVillains = [
    { emoji: '💀', name: 'Death Skull', color: '#8B0000', size: 45, health: 1, points: 10, speed: 2 },
    { emoji: '👹', name: 'Demon', color: '#DC143C', size: 50, health: 2, points: 20, speed: 1.5 },
    { emoji: '🤖', name: 'Evil Robot', color: '#2F4F4F', size: 48, health: 3, points: 30, speed: 1.8 },
    { emoji: '👾', name: 'Alien Monster', color: '#4B0082', size: 46, health: 2, points: 25, speed: 2.2 },
    { emoji: '🦴', name: 'Skeleton', color: '#696969', size: 44, health: 1, points: 15, speed: 2.5 },
    { emoji: '🕸️', name: 'Web Monster', color: '#800080', size: 42, health: 1, points: 12, speed: 1.7 }
];

let obstacleTimer = 0;
let gameSpeed = 2;
let difficultyTimer = 0;

// Particle effects
const particles = [];

// Background elements
const stars = [];

function initStars() {
    for (let i = 0; i < 50; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, twinkle: Math.random() * 0.02 + 0.01 });
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#2d1b69');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        const opacity = 0.5 + Math.sin(Date.now() * star.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
    });

    ctx.fillStyle = '#000';
    for (let i = 0; i < canvas.width; i += 60) {
        const height = Math.random() * 100 + 50;
        ctx.fillRect(i, canvas.height - height, 60, height);
    }
}

function drawHero() {
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, hero.radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hero.x - 18, hero.y, hero.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();

    const heroGradient = ctx.createRadialGradient(hero.x - 5, hero.y - 5, 0, hero.x, hero.y, hero.radius);
    heroGradient.addColorStop(0, '#4ecdc4');
    heroGradient.addColorStop(1, '#44a08d');

    ctx.beginPath();
    ctx.arc(hero.x, hero.y, hero.radius, 0, Math.PI * 2);
    ctx.fillStyle = heroGradient;
    ctx.fill();

    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('🦸', hero.x, hero.y + 7);
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x - 10, bullet.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd93d';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 217, 61, 0.3)';
        ctx.fill();
    });
}

function drawVillains() {
    villains.forEach(villain => {
        ctx.beginPath();
        ctx.arc(villain.x, villain.y, villain.size / 2 + 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 0, 0, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(villain.x + 5, villain.y + 5, villain.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(villain.x, villain.y, villain.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = villain.color;
        ctx.fill();

        if (villain.health > 1) {
            ctx.fillStyle = '#ff0000';
            for (let i = 0; i < villain.health; i++) {
                ctx.fillRect(villain.x - 15 + i * 8, villain.y - villain.size / 2 - 15, 6, 8);
            }
        }

        ctx.font = `${villain.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(villain.emoji, villain.x, villain.y + villain.size / 6);

        ctx.beginPath();
        ctx.arc(villain.x, villain.y, villain.size / 2 + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
    });
}

function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
        ctx.fill();

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.opacity -= 0.02;
        particle.size *= 0.98;

        if (particle.opacity <= 0) {
            particles.splice(index, 1);
        }
    });
}

function createExplosion(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, size: Math.random() * 6 + 3, opacity: 1, color: `255, ${Math.random() * 100 + 100}, 0` });
    }
}

function createVillain() {
    const type = scaryVillains[Math.floor(Math.random() * scaryVillains.length)];
    const minY = 80;
    const maxY = canvas.height - 100;

    villains.push({ x: canvas.width + 50, y: Math.random() * (maxY - minY) + minY, ...type, maxHealth: type.health, passed: false });
}

function shootBullet() {
    if (ammo > 0) {
        bullets.push({ x: hero.x + hero.radius, y: hero.y, speed: 8 });
        ammo -= 5;
        updateAmmoBar();
    }
}

function updateAmmoBar() {
    const ammoPercent = (ammo / maxAmmo) * 100;
    document.getElementById('ammoFill').style.width = ammoPercent + '%';
}

function updateGame() {
    if (gameState !== 'playing') return;

    hero.velocity += hero.gravity;
    hero.y += hero.velocity;

    if (hero.y - hero.radius < 0) {
        hero.y = hero.radius;
        hero.velocity = 0;
    }
    if (hero.y + hero.radius > canvas.height) {
        gameOver();
    }

    bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        if (bullet.x > canvas.width) bullets.splice(index, 1);
    });

    villains.forEach((villain, index) => {
        villain.x -= villain.speed;
        if (!villain.passed && villain.x < hero.x) {
            villain.passed = true;
            score += 5;
            document.getElementById('scoreValue').textContent = score;
        }
        if (villain.x < -villain.size) villains.splice(index, 1);
    });

    bullets.forEach((bullet, bulletIndex) => {
        villains.forEach((villain, villainIndex) => {
            const distance = Math.hypot(bullet.x - villain.x, bullet.y - villain.y);
            if (distance < 4 + villain.size / 2) {
                bullets.splice(bulletIndex, 1);
                villain.health--;
                if (villain.health <= 0) {
                    createExplosion(villain.x, villain.y);
                    score += villain.points;
                    killCount++;
                    document.getElementById('scoreValue').textContent = score;
                    document.getElementById('killCount').textContent = killCount;
                    villains.splice(villainIndex, 1);
                }
            }
        });
    });

    obstacleTimer++;
    if (obstacleTimer > 120 - Math.min(killCount * 2, 60)) {
        createVillain();
        obstacleTimer = 0;
    }

    ammoRegenTimer++;
    if (ammoRegenTimer > 10 && ammo < maxAmmo) {
        ammo++;
        ammoRegenTimer = 0;
        updateAmmoBar();
    }

    difficultyTimer++;
    if (difficultyTimer > 1800) {
        gameSpeed += 0.2;
        difficultyTimer = 0;
    }

    checkCollisions();
}

function checkCollisions() {
    villains.forEach(villain => {
        const distance = Math.hypot(hero.x - villain.x, hero.y - villain.y);
        if (distance < hero.radius + villain.size / 2 - 8) {
            gameOver();
        }
    });
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalKills').textContent = killCount;
    document.getElementById('gameOverScreen').style.display = 'block';
    if (score > highScore) {
        highScore = score;
        document.getElementById('highScoreValue').textContent = highScore;
    }
}

function fly() {
    if (gameState === 'playing') hero.velocity = hero.bounce;
}

function startGame() {
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
}

function resetGame() {
    gameState = 'start';
    score = 0;
    killCount = 0;
    gameSpeed = 2;
    obstacleTimer = 0;
    difficultyTimer = 0;
    ammo = maxAmmo;
    hero.x = 120;
    hero.y = 300;
    hero.velocity = 0;
    villains.length = 0;
    bullets.length = 0;
    particles.length = 0;
    document.getElementById('scoreValue').textContent = '0';
    document.getElementById('killCount').textContent = '0';
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('gameOverScreen').style.display = 'none';
    updateAmmoBar();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawParticles();
    drawVillains();
    drawBullets();
    drawHero();
    updateGame();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        fly();
    }
});

canvas.addEventListener('click', (e) => {
    if (gameState === 'playing') {
        shootBullet();
    }
});

initStars();
updateAmmoBar();
gameLoop();
