// Game State
const gameState = {
    clicks: 0,
    pokedexCount: 0,
    currentPokemon: 1,
    currentHP: 100,
    maxHP: 100,
    damagePerClick: 1,
    caughtPokemon: [],
    upgrades: {},
    totalCPS: 0
};

// Pokemon List (first 151)
const pokemonList = Array.from({ length: 151 }, (_, i) => i + 1);

// Upgrade Definitions
const upgrades = {
    pokeball: {
        name: '🔴 Poké Ball',
        description: 'Increases damage by 1',
        baseCost: 10,
        effect: () => gameState.damagePerClick += 1
    },
    greatball: {
        name: '🟢 Great Ball',
        description: 'Increases damage by 5',
        baseCost: 100,
        effect: () => gameState.damagePerClick += 5
    },
    ultraball: {
        name: '💜 Ultra Ball',
        description: 'Increases damage by 20',
        baseCost: 500,
        effect: () => gameState.damagePerClick += 20
    },
    masterball: {
        name: '⚫ Master Ball',
        description: 'Increases damage by 100',
        baseCost: 5000,
        effect: () => gameState.damagePerClick += 100
    },
    trainer: {
        name: '👨‍🏫 Trainer',
        description: 'Adds 0.1 clicks per second',
        baseCost: 1000,
        effect: () => startAutoClicker(0.1)
    },
    professor: {
        name: '🧪 Professor',
        description: 'Adds 1 click per second',
        baseCost: 10000,
        effect: () => startAutoClicker(1)
    },
    pokedex: {
        name: '📖 Pokédex',
        description: 'Doubles damage per click',
        baseCost: 50000,
        effect: () => gameState.damagePerClick *= 2
    }
};

// Initialize upgrades
Object.keys(upgrades).forEach(key => {
    gameState.upgrades[key] = { level: 0, clicksPerSecond: 0 };
});

// DOM Elements
const clickBtn = document.getElementById('click-btn');
const pokemonImg = document.getElementById('pokemon-img');
const pokemonName = document.getElementById('pokemon-name');
const hpFill = document.getElementById('hp-fill');
const hpText = document.getElementById('hp-text');
const clicksDisplay = document.getElementById('clicks');
const pokedexDisplay = document.getElementById('pokedex');
const cpsDisplay = document.getElementById('cps');
const multiplierDisplay = document.getElementById('multiplier-text');
const upgradesContainer = document.getElementById('upgrades-container');
const caughtList = document.getElementById('caught-list');

// Initialize game
function init() {
    loadGame();
    loadPokemon(gameState.currentPokemon);
    renderUpgrades();
    updateDisplay();
    setInterval(updateDisplay, 100);
}

// Load Pokemon data
async function loadPokemon(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        pokemonName.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        pokemonImg.src = data.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/${id}.png`;
        
        gameState.currentHP = gameState.maxHP;
        gameState.currentHP = gameState.maxHP;
        updateDisplay();
    } catch (error) {
        console.error('Error loading Pokemon:', error);
    }
}

// Handle click
clickBtn.addEventListener('click', () => {
    gameState.clicks += gameState.damagePerClick;
    gameState.currentHP -= gameState.damagePerClick;

    // Create floating text
    createFloatingText(gameState.damagePerClick);

    if (gameState.currentHP <= 0) {
        catchPokemon();
    }

    updateDisplay();
});

// Catch Pokemon
function catchPokemon() {
    gameState.pokedexCount++;
    gameState.caughtPokemon.push(gameState.currentPokemon);
    
    // Random next Pokemon
    gameState.currentPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    gameState.currentHP = gameState.maxHP;
    
    loadPokemon(gameState.currentPokemon);
    updateDisplay();
    renderCaughtList();
    
    // Celebration animation
    clickBtn.textContent = '✨ Pokémon Caught! ✨';
    setTimeout(() => {
        clickBtn.innerHTML = '<span class="click-text">Click to Catch!</span>';
    }, 500);
}

// Create floating damage text
function createFloatingText(damage) {
    const text = document.createElement('div');
    text.textContent = '+' + damage;
    text.style.position = 'fixed';
    text.style.pointerEvents = 'none';
    text.style.fontWeight = 'bold';
    text.style.color = '#667eea';
    text.style.fontSize = '1.5em';
    text.style.left = event.clientX + 'px';
    text.style.top = event.clientY + 'px';
    text.style.zIndex = '1000';
    
    document.body.appendChild(text);
    
    let opacity = 1;
    let y = 0;
    const interval = setInterval(() => {
        y -= 3;
        opacity -= 0.05;
        text.style.transform = `translateY(${y}px)`;
        text.style.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(interval);
            document.body.removeChild(text);
        }
    }, 30);
}

// Render upgrades
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    
    Object.entries(upgrades).forEach(([key, upgrade]) => {
        const level = gameState.upgrades[key].level;
        const cost = upgrade.baseCost * Math.pow(1.15, level);
        const canAfford = gameState.clicks >= cost;
        
        const div = document.createElement('div');
        div.className = `upgrade-item ${!canAfford ? 'disabled' : ''}`;
        div.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-desc">${upgrade.description}</div>
            <div class="upgrade-cost">Cost: ${Math.floor(cost)} clicks</div>
            <div class="upgrade-level">Level: ${level}</div>
        `;
        
        if (canAfford) {
            div.addEventListener('click', () => buyUpgrade(key));
        }
        
        upgradesContainer.appendChild(div);
    });
}

// Buy upgrade
function buyUpgrade(key) {
    const upgrade = upgrades[key];
    const level = gameState.upgrades[key].level;
    const cost = upgrade.baseCost * Math.pow(1.15, level);
    
    if (gameState.clicks >= cost) {
        gameState.clicks -= cost;
        gameState.upgrades[key].level++;
        upgrade.effect();
        updateDisplay();
        renderUpgrades();
        saveGame();
    }
}

// Auto clicker
function startAutoClicker(cps) {
    if (!gameState.upgrades.trainer.level && !gameState.upgrades.professor.level) {
        setInterval(() => {
            const totalCPS = Object.values(gameState.upgrades).reduce((acc, u) => acc + u.clicksPerSecond, 0);
            if (totalCPS > 0) {
                gameState.clicks += totalCPS / 10;
                gameState.currentHP -= totalCPS / 10;
                
                if (gameState.currentHP <= 0) {
                    catchPokemon();
                }
                updateDisplay();
            }
        }, 100);
        return;
    }
    
    gameState.upgrades.trainer.clicksPerSecond = (gameState.upgrades.trainer.level || 0) * 0.1;
    gameState.upgrades.professor.clicksPerSecond = (gameState.upgrades.professor.level || 0) * 1;
}

// Render caught list
function renderCaughtList() {
    caughtList.innerHTML = '';
    const uniqueCaught = [...new Set(gameState.caughtPokemon)].slice(-10);
    
    uniqueCaught.forEach(id => {
        const div = document.createElement('div');
        div.className = 'caught-item';
        div.innerHTML = `
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/${id}.png" alt="Pokemon ${id}">
            <span>#${id}</span>
        `;
        caughtList.appendChild(div);
    });
}

// Update display
function updateDisplay() {
    clicksDisplay.textContent = Math.floor(gameState.clicks);
    pokedexDisplay.textContent = gameState.pokedexCount;
    
    const hpPercent = (gameState.currentHP / gameState.maxHP) * 100;
    hpFill.style.width = Math.max(0, hpPercent) + '%';
    hpText.textContent = `${Math.max(0, Math.floor(gameState.currentHP))}/${gameState.maxHP} HP`;
    
    multiplierDisplay.textContent = `Damage per click: ${gameState.damagePerClick}`;
    
    // Calculate CPS
    gameState.totalCPS = (gameState.upgrades.trainer.level || 0) * 0.1 + (gameState.upgrades.professor.level || 0) * 1;
    cpsDisplay.textContent = gameState.totalCPS.toFixed(1);
    
    renderUpgrades();
}

// Save/Load Game
function saveGame() {
    localStorage.setItem('pokeclicker', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('pokeclicker');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
    }
}

// Auto-save every 5 seconds
setInterval(saveGame, 5000);

// Start game
init();
