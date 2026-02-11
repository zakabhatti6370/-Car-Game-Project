// ================= CONFIGURATION & ASSETS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 520;
canvas.height = 800;

let car, obstacles, coins, gameOver = true, score, roadY, playerName = "Player", wallet = 0, scoreHistory = [];

const carImage = new Image(); carImage.src = 'img/car.png';
const roadImage = new Image(); roadImage.src = 'img/road.png';
const coinImage = new Image(); coinImage.src = 'img/coin.png';

const trafficImages = ['img/obstacle.png', 'img/obstacle2.png', 'img/obstacle3.png', 'img/obstacle4.png'];

const crashSound = new Audio('mp3/crash.mp3');
const moveSound = new Audio('mp3/move.mp3');
const hornSound = new Audio('mp3/horn.mp3');
const coinSound = new Audio('mp3/coin.mp3');

// ================= STORAGE & UI =================
function loadData() {
    wallet = parseInt(localStorage.getItem("carGameWallet")) || 0;
    scoreHistory = JSON.parse(localStorage.getItem("carGameScores")) || [];
    playerName = localStorage.getItem("currentPlayerName") || "Player";
    document.getElementById("displayName").innerText = playerName;
    updateUI();
}

function saveData() {
    localStorage.setItem("carGameWallet", wallet);
    localStorage.setItem("carGameScores", JSON.stringify(scoreHistory));
    localStorage.setItem("currentPlayerName", playerName);
}

function updateUI() {
    const walletDisplay = document.getElementById("walletBalance");
    if(walletDisplay) walletDisplay.innerText = wallet;
    displayScores(); // UI update hote hi table bhi refresh ho
}

// ================= RESET & START LOGIC (FIXED) =================

// Yeh function Game ko bilkul shuru se restart karega (Reset Button ke liye)
function resetGame() {
    // 1. Agar game chal rahi hai to rokh dein
    gameOver = true;
    
    // 2. Variables ko zero karein
    score = 0;
    document.getElementById("score").innerText = score;
    
    // 3. Game ko dobara initialize karein
    initializeGame();
    
    // 4. Score board ko refresh karein
    updateUI();
    
    console.log("Game Reset Successful!");
}

function startGame() {
    initializeGame();
    updateGame();
}

// ================= GAME ENGINE =================
function initializeGame() {
    car = { x: 235, y: 650, width: 50, height: 100, speed: 25 };
    
    obstacles = [
        { x: 100, y: -100, width: 50, height: 100, speed: 5, img: new Image() },
        { x: 350, y: -450, width: 50, height: 100, speed: 7, img: new Image() }
    ];
    obstacles.forEach(ob => ob.img.src = trafficImages[Math.floor(Math.random() * trafficImages.length)]);

    coins = [
        { x: Math.random() * 400 + 50, y: -200, width: 30, height: 30, speed: 5 },
        { x: Math.random() * 400 + 50, y: -600, width: 30, height: 30, speed: 5 }
    ];

    gameOver = false;
    score = 0;
    roadY = 0;
    document.getElementById("score").innerText = score;
}

function updateGame() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    roadY = (roadY + 7) % canvas.height;
    ctx.drawImage(roadImage, 0, roadY - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(roadImage, 0, roadY, canvas.width, canvas.height);

    ctx.drawImage(carImage, car.x, car.y, car.width, car.height);

    obstacles.forEach(ob => {
        ob.y += ob.speed;
        ctx.drawImage(ob.img, ob.x, ob.y, ob.width, ob.height);

        if (ob.y > canvas.height) {
            ob.y = -150;
            ob.x = 50 + Math.random() * (canvas.width - 150);
            ob.img.src = trafficImages[Math.floor(Math.random() * trafficImages.length)];
            score += 10;
            document.getElementById("score").innerText = score;
            hornSound.currentTime = 0;
            hornSound.play().catch(()=>{}); 
        }

        if (car.x < ob.x + ob.width && car.x + car.width > ob.x &&
            car.y < ob.y + ob.height && car.y + car.height > ob.y) {
            handleGameOver();
        }
    });

    coins.forEach(coin => {
        coin.y += coin.speed;
        ctx.drawImage(coinImage, coin.x, coin.y, coin.width, coin.height);

        if (car.x < coin.x + coin.width && car.x + car.width > coin.x &&
            car.y < coin.y + coin.height && car.y + car.height > coin.y) {
            coin.y = -Math.random() * 500;
            coin.x = 50 + Math.random() * (canvas.width - 100);
            wallet += 10;
            coinSound.currentTime = 0;
            coinSound.play().catch(()=>{});
            updateUI();
            saveData();
        }

        if (coin.y > canvas.height) {
            coin.y = -100;
            coin.x = 50 + Math.random() * (canvas.width - 100);
        }
    });

    requestAnimationFrame(updateGame);
}

function handleGameOver() {
    gameOver = true;
    crashSound.play();
    scoreHistory.push({ name: playerName, score: score, date: new Date().toLocaleDateString() });
    saveData();
    updateUI();
    
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.fillText("GAME OVER! Press R", 120, 400);
}

// ================= CONTROLS =================
document.addEventListener("keydown", (e) => {
    if (!gameOver) {
        const s = car.speed;
        if ((e.key === "ArrowLeft" || e.key === "a") && car.x > 50) car.x -= s;
        if ((e.key === "ArrowRight" || e.key === "d") && car.x < canvas.width - 100) car.x += s;
        if ((e.key === "ArrowUp" || e.key === "w") && car.y > 50) car.y -= s;
        if ((e.key === "ArrowDown" || e.key === "s") && car.y < canvas.height - 110) car.y += s;
        moveSound.play().catch(()=>{});
    } else if (e.key.toLowerCase() === "r") {
        startGame();
    }
});

// ================= HISTORY & MODAL (CLEAN) =================

function setPlayerName() {
    const input = document.getElementById("playerName");
    if (input.value.trim()) {
        playerName = input.value.trim();
        document.getElementById("displayName").innerText = playerName;
        saveData();
        input.value = "";
    }
}

function toggleHistory() {
    const content = document.getElementById("historyContent");
    const btn = document.getElementById("toggleBtn");
    if (!content) return;

    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
        if (btn) btn.innerText = "▼ History";
        displayScores();
    } else {
        content.style.display = "none";
        if (btn) btn.innerText = "▶ History";
    }
}

function displayScores() {
    const mainTbody = document.getElementById("scoresBody");
    const fullTbody = document.getElementById("fullScoresBody");
    let history = JSON.parse(localStorage.getItem("carGameScores")) || [];

    const rows = history.length > 0 ? history.slice().reverse().map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td>${s.score}</td>
            <td>${s.date}</td>
        </tr>
    `).join('') : '<tr><td colspan="4">No scores yet</td></tr>';

    if (mainTbody) mainTbody.innerHTML = rows;
    if (fullTbody) fullTbody.innerHTML = rows;
}

function openHistoryModal() {
    const modal = document.getElementById("historyModal");
    if (modal) {
        modal.style.display = "block";
        displayScores();
    }
}

function closeHistoryModal() {
    const modal = document.getElementById("historyModal");
    if (modal) modal.style.display = "none";
}

window.onload = loadData;
roadImage.onload = () => { ctx.drawImage(roadImage, 0, 0, canvas.width, canvas.height); };



// ================= MOBILE CONTROLS FIX =================

function move(dir) {
    if (gameOver) return;
    const s = car.speed;
    
    if (dir === 'left' && car.x > 50) car.x -= s;
    if (dir === 'right' && car.x < canvas.width - 100) car.x += s;
    if (dir === 'up' && car.y > 50) car.y -= s;
    if (dir === 'down' && car.y < canvas.height - 110) car.y += s;
    
    moveSound.currentTime = 0;
    moveSound.play().catch(()=>{});
}

// Function to attach events to both touch and click
function attachControl(id, direction) {
    const btn = document.getElementById(id);
    if (!btn) return;

    // Mobile Touch ke liye
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        move(direction);
    }, { passive: false });

    // PC Click ke liye (Testing ke liye)
    btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        move(direction);
    });
}

// Window load hone par buttons ko activate karein
window.addEventListener("load", () => {
    loadData();
    attachControl("btn-up", "up");
    attachControl("btn-down", "down");
    attachControl("btn-left", "left");
    attachControl("btn-right", "right");
});
// ================= RESET ALL HISTORY =================
function resetHistory() {
    if (confirm("Kya aap saara score history khatam karna chahte hain?")) {
        
        localStorage.removeItem("carGameScores");
        
       
        scoreHistory = [];
        
        displayScores();
        
        alert("History successfully saaf kar di gayi hai!");
    }
}