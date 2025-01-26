const startGameButton = document.getElementById('start-game-btn');
const resetButton = document.getElementById('reset-btn');
const accueilPage = document.getElementById('accueil');
const gamePage = document.getElementById('game');   
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const modeElement = document.getElementById('mode');
const symbolElement = document.getElementById('symbol');
const themesElement = document.getElementById('themes');
const scoreboardElement = document.getElementById('scoreboard');
const gridSizeElement = document.getElementById('grid-size');
const timerSelect = document.getElementById("timer");
const voiceModeElement = document.getElementById('voice-mode');
const backgroundColorPicker = document.getElementById('background-color');

const expandGridButton = document.getElementById('expand-grid-btn');
const shrinkGridButton = document.getElementById('shrink-grid-btn');

// Variables globales
let board;
let taille = 3;
let currentPlayer;
let gameMode;
let scoreX = 0;
let scoreO = 0;
let playerSymbol, aiSymbol;
let playerThemes;
let timer;
let timeRemaining;
let gameOver = false;
let symbolsToWin = Math.min(taille, 4); 


// Initialiser la reconnaissance vocale
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'fr-FR';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

recognition.onstart = () => {
    microphoneStatus.classList.add('active');
    console.log('Reconnaissance vocale démarrée');
};

recognition.onend = () => {
    microphoneStatus.classList.remove('active');
    console.log('Reconnaissance vocale terminée');
};

recognition.onerror = (event) => {
    console.error('Erreur de reconnaissance vocale:', event.error);
    alert('Erreur de reconnaissance vocale. Veuillez réessayer.');
};

// Demander la permission d'utiliser le microphone
function requestMicrophonePermission() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            console.log('Microphone activé');
        })
        .catch(error => {
            console.error('Erreur d\'activation du microphone:', error);
            alert('Erreur d\'activation du microphone. Veuillez vérifier les permissions de votre navigateur.');
        });
}

// Lorsque le bouton "Commencer à jouer" est cliqué
startGameButton.addEventListener('click', () => {
    // Demander la permission d'utiliser le microphone
    requestMicrophonePermission();

    

    // Affiche les règles du jeu avant de commencer
    alert("Règles du jeu :\n\n" +
          "1. Deux joueurs jouent à tour de rôle pour remplir les cases du plateau.\n" +
          "2. Le premier à aligner trois symboles (horizontalement, verticalement ou en diagonale) gagne.\n" +
          "3. Le jeu prend fin quand un joueur gagne ou que le plateau est rempli.\n\n" +
          "Mode vocal pour la grille 3x3:\n" +
          "Dites le numéro de la cellule (de 1 à 9) pour placer votre pion.\n\n" +
          "Appuyez sur OK pour commencer !");
    
    // Démarre le jeu après la fermeture de l'alerte
    startGame();
});

// Ajouter un écouteur pour le bouton de réinitialisation
resetButton.addEventListener('click', startGame);

// Fonction pour démarrer le jeu
function startGame() {
    accueilPage.style.display = 'none';
    gamePage.style.display = 'block';
    boardElement.style.display = 'grid'; // Affiche la grille
    // Réinitialise les variables de jeu
    taille = parseInt(gridSizeElement.value, 10) || 3; 
    board = Array(taille * taille).fill(null); // Tableau ajusté
    gameMode = modeElement.value;
    applyTheme();
    currentPlayer = voiceModeElement.checked ? aiSymbol : playerSymbol; // L'IA commence si le mode vocal est activé
    statusElement.textContent = `Temps restant : ${timeRemaining} secondes`;
    timer = setInterval(() => {
        timeRemaining--;
        statusElement.textContent = `Temps restant : ${timeRemaining} secondes`;

        if (timeRemaining <= 0) {
            clearInterval(timer);
            statusElement.textContent = "Temps écoulé ! Partie terminée.";
        }
    }, 1000); // Décrémente chaque seconde

    statusElement.textContent = `C'est au tour de ${currentPlayer}`;
    // Demander à l'utilisateur de saisir le temps de jeu souhaité
    const userTime = prompt("Combien de temps souhaitez-vous jouer ? (en minutes et secondes, par exemple 1:30 pour 1 minute et 30 secondes ou 90 pour 90 secondes)", "1:00");
    if (userTime !== null) {
        let timeParts = userTime.split(':');
        if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
            const minutes = parseInt(timeParts[0], 10);
            const seconds = parseInt(timeParts[1], 10);
            timeRemaining = (minutes * 60) + seconds;
        } else if (!isNaN(userTime)) {
            timeRemaining = parseInt(userTime, 10);
        } else {
            alert("Temps invalide. Le temps par défaut de 30 secondes sera utilisé.");
            timeRemaining = 30; // Temps par défaut de 30 secondes
        }
    } else {
        alert("Temps invalide. Le temps par défaut de 30 secondes sera utilisé.");
        timeRemaining = 30; // Temps par défaut de 30 secondes
    }
    updateScoreboard();
    renderBoard();

    // Si l'IA commence en premier
    if (currentPlayer === aiSymbol) {
        setTimeout(aiMove, 500);
    } else if (voiceModeElement.checked) {
        startVoiceRecognition(); // Démarrer la reconnaissance vocale pour le joueur
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById("timer"); // Assure-toi que l'élément existe dans ton HTML
    if (timerElement) {
        timerElement.textContent = `Temps restant : ${remainingTime}s`;
    }
}


// Fonction pour afficher le plateau de jeu
function renderBoard() {
    console.log("Rendering board..."); // Vérifie si la fonction est appelée
    boardElement.style.setProperty('--grid-size', taille); // Applique la taille de la grille
    boardElement.style.gridTemplateColumns = `repeat(${taille}, 100px)`; // Définit les colonnes
    boardElement.style.gridTemplateRows = `repeat(${taille}, 100px)`;   // Définit les lignes
    boardElement.innerHTML = ''; // Nettoie les anciennes cellules

    // Crée les cellules du plateau
    board.forEach((cell, index) => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        if (cell) cellElement.classList.add('taken'); // Ajoute une classe si la cellule est occupée
        if (!cell && voiceModeElement.checked) {
            cellElement.classList.add('number'); // Ajoute une classe pour les chiffres en mode vocal
            cellElement.textContent = index + 1; // Affiche le numéro de la cellule
        } else {
            cellElement.textContent = cell || ''; // Affiche le symbole ou reste vide
        }
        cellElement.addEventListener('click', () => makeMove(index)); // Gère le clic
        boardElement.appendChild(cellElement); // Ajoute la cellule au DOM
    });

    console.log("Board rendered:", boardElement.innerHTML); // Vérifie l'affichage
}



function updateBoard(gridSize) {
    taille = gridSize; // Ajuster la taille globale
    symbolsToWin = Math.min(4, taille); // Ajuster les symboles nécessaires à la victoire
    board = Array(taille * taille).fill(null);
    renderBoard();
}
// Initialisation de la grille par défaut (3x3)
updateBoard(3);

// Fonction pour appliquer un thème de jeu
function applyTheme() {
    const theme = themesElement.value;
    const videoElement = document.getElementById('background-video');
    const videoSource = videoElement.querySelector('source');

    // Cache la vidéo par défaut
    videoElement.classList.remove('show');
    videoSource.src = '';
    // Associe les thèmes à des vidéos et des symboles
    switch (theme) {
        case 'espace':
            videoSource.src = 'elements/espace.mp4';
            playerSymbol = '🪐';
            aiSymbol = '🚀';
            break;
        case 'mer':
            videoSource.src = 'elements/mer.mp4';
            playerSymbol = '🦀';
            aiSymbol = '🐚';
            break;
        case 'foret':
            videoSource.src = 'elements/foret.mp4';
            playerSymbol = '🌳';
            aiSymbol = '🍄';
            break;
        case 'fleurs':
            videoSource.src = 'elements/fleurs.mp4';
            playerSymbol = '🌸';
            aiSymbol = '💮';
            break;
        default:
            playerSymbol = symbolElement.value || 'X';
            aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
    }

    // Recharge la vidéo si une nouvelle source a été appliquée
    if (videoSource.src) {
        videoElement.load();
        videoElement.classList.add('show'); // Affiche la vidéo
    } else {
        console.error('Erreur de chargement de la vidéo pour le thème:', theme);
    }

    // Mets à jour le statut avec le symbole du joueur
    statusElement.textContent = `C'est au tour de ${currentPlayer}`;
}

// Fonction pour changer la couleur de fond
backgroundColorPicker.addEventListener('input', (event) => {
    document.body.style.backgroundColor = event.target.value;
});

// Gère le changement de thème
themesElement.addEventListener('change', applyTheme);


// Fonction pour démarrer la reconnaissance vocale lorsque c'est au tour du joueur
function startVoiceRecognition() {
    console.log('Démarrage de la reconnaissance vocale...');
    recognition.start();
    recognition.onresult = (event) => {
        const voiceInput = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Entrée vocale:', voiceInput);
        handleVoiceInput(voiceInput);
    };
    recognition.onerror = (event) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        alert('Erreur de reconnaissance vocale. Veuillez réessayer.');
        startVoiceRecognition(); // Redémarrer la reconnaissance vocale en cas d'erreur
    };
    recognition.onend = () => {
        if (!gameOver && currentPlayer === playerSymbol) {
            startVoiceRecognition(); // Redémarrer la reconnaissance vocale si le jeu n'est pas terminé
        }
    };
}

// Gérer l'entrée vocale pour placer les pions
function handleVoiceInput(input) {
    const cellNames = {
        'un': 0, '1': 0, 'one': 0,
        'deux': 1, '2': 1, 'two': 1,
        'trois': 2, '3': 2, 'three': 2,
        'quatre': 3, '4': 3, 'four': 3,
        'cinq': 4, '5': 4, 'five': 4,
        'six': 5, '6': 5, 'six': 5,
        'sept': 6, '7': 6, 'seven': 6,
        'huit': 7, '8': 7, 'eight': 7,
        'neuf': 8, '9': 8, 'nine': 8,
        'centre': 4, 'milieu': 4, 'center': 4, 'middle': 4,
        'haut gauche': 0, 'haut droite': 2, 'top left': 0, 'top right': 2,
        'bas gauche': 6, 'bas droite': 8, 'bottom left': 6, 'bottom right': 8
    };

    // Normaliser l'entrée vocale
    input = input.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();

    // Améliorer la détection des chiffres
    const numberMap = {
        'zéro': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4',
        'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9',
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
    };
    input = input.split(' ').map(word => numberMap[word] || word).join(' ');

    const position = cellNames[input];
    if (position !== undefined) {
        makeMove(position);
    } else {
        alert("Entrée vocale non valide. Veuillez dire un numéro de cellule valide ou son nom.");
        startVoiceRecognition(); // Redémarrer la reconnaissance vocale en cas d'entrée non valide
    }
}

function endGame() {
    gameOver = true; // Marquer la fin du jeu
    statusElement.textContent = `${currentPlayer} gagne !`; // Affiche le message de victoire
    clearInterval(timer); // Arrête le minuteur

}

// Fonction pour effectuer un coup
function makeMove(index) {
    if (gameOver) {
        return; // Si le jeu est terminé, on ne fait rien
    }

    if (board[index]) {
        alert("Case occupée, essayez une autre.");
        return; // Empêche de jouer sur une cellule déjà occupée
    }

    board[index] = currentPlayer; // Marque la cellule pour le joueur actuel
    const cellElement = boardElement.children[index];
    cellElement.textContent = currentPlayer; // Affiche le symbole du joueur actuel
    cellElement.classList.add('taken'); // Ajoute la classe 'taken' pour marquer la cellule comme occupée

    if (checkWinner()) {
        statusElement.textContent = `${currentPlayer} gagne !`;
        updateScore(currentPlayer);
        endGame();
        return;
    } else if (board.every(cell => cell)) { // Vérifie si toutes les cellules sont remplies
        statusElement.textContent = 'Match nul !';
        endGame();
        return;
    }

    // Change de joueur
    currentPlayer = currentPlayer === playerSymbol ? aiSymbol : playerSymbol;
    statusElement.textContent = `C'est au tour de ${currentPlayer}`;
    renderBoard();

    // Si le mode IA est actif et c'est au tour de l'IA
    if (gameMode !== '2p' && currentPlayer === aiSymbol) {
        setTimeout(aiMove, 500);
    } else if (currentPlayer === playerSymbol && voiceModeElement.checked) {
        startVoiceRecognition(); // Démarrer la reconnaissance vocale pour le joueur
    }
}

// Fonction pour gérer la victoire
function updateScore(winner) {
    if (winner === playerSymbol) {
        scoreX++;
    } else {
        scoreO++;
    }
    updateScoreboard();
}

// Met à jour l'affichage des scores
function updateScoreboard() {
    scoreboardElement.textContent = `Score - ${playerSymbol}: ${scoreX} | ${aiSymbol}: ${scoreO}`;
}

// Fonction pour réinitialiser le jeu
function resetGame() {
    clearInterval(timer);  // Arrête le minuteur
    gameOver = false;
    const resultDiv = document.querySelector('div');
    if (resultDiv) resultDiv.remove();
    startGame();
}

// Fonction pour l'IA
function aiMove() {
    let move;
    if (gameMode === 'ai-easy') {
        move = getRandomMove();
    } else if (gameMode === 'ai-medium') {
        move = getMediumMove();
    } else if (gameMode === 'ai-hard') {
        move = getBestMove();
    }
    if (move !== undefined) {
        makeMove(move);
    }
}

// Fonctions pour l'IA
function getRandomMove() {
    const availableMoves = board.map((cell, index) => cell ? null : index).filter(index => index !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}



// Fonction pour vérifier la victoire
function checkWinner() {
    const gridSize = taille; // Taille de la grille (ex : 5 pour 5x5)
    const symbolsToWin = gridSize; // Nombre de symboles nécessaires pour gagner (par défaut = taille)

    const directions = [
        { x: 1, y: 0 }, // Horizontal
        { x: 0, y: 1 }, // Vertical
        { x: 1, y: 1 }, // Diagonale principale
        { x: 1, y: -1 } // Diagonale secondaire
    ];

    // Parcours chaque cellule
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            const player = board[index];

            if (!player) continue; // Ignore les cellules vides

            // Vérifie dans chaque direction
            for (const dir of directions) {
                let count = 1;

                for (let step = 1; step < symbolsToWin; step++) {
                    const newRow = row + dir.y * step;
                    const newCol = col + dir.x * step;

                    if (
                        newRow >= 0 &&
                        newRow < gridSize &&
                        newCol >= 0 &&
                        newCol < gridSize &&
                        board[newRow * gridSize + newCol] === player
                    ) {
                        count++;
                    } else {
                        break; // Arrête si une cellule ne correspond pas
                    }
                }

                if (count === symbolsToWin) {
                    return true; // Victoire si suffisamment de symboles sont alignés
                }
            }
        }
    }
    return false; // Pas de victoire trouvée
}



function getMediumMove() {
    // Essayez de gagner en jouant un coup gagnant
    for (let i = 0; i < board.length; i++) {
        if (!board[i]) {
            board[i] = aiSymbol;
            if (checkWinner()) {
                board[i] = null; // Annule temporairement
                return i;
            }
            board[i] = null; // Annule temporairement
        }
    }
    // Sinon, choisissez un coup au hasard
    return getRandomMove();
}

function getBestMove() {
    // Implémentation basique du Minimax (non optimisé pour toutes les tailles)
    let bestScore = -Infinity;
    let move;

    for (let i = 0; i < board.length; i++) {
        if (!board[i]) {
            board[i] = aiSymbol;
            let score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(newBoard, depth, isMaximizing) {
    if (checkWinner()) {
        return isMaximizing ? -10 : 10;
    }
    if (newBoard.every(cell => cell)) {
        return 0; // Match nul
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < newBoard.length; i++) {
            if (!newBoard[i]) {
                newBoard[i] = aiSymbol;
                let score = minimax(newBoard, depth + 1, false);
                newBoard[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < newBoard.length; i++) {
            if (!newBoard[i]) {
                newBoard[i] = playerSymbol;
                let score = minimax(newBoard, depth + 1, true);
                newBoard[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Fonction pour agrandir la grille
expandGridButton.addEventListener('click', () => {
    boardElement.style.transform = 'scale(1.5)';
    expandGridButton.style.display = 'none';
    shrinkGridButton.style.display = 'inline-block';
    shrinkGridButton.style.visibility = 'visible'; // Pour que le bouton soit visible
});

// Fonction pour réduire la grille
shrinkGridButton.addEventListener('click', () => {
    boardElement.style.transform = 'scale(1)';
    shrinkGridButton.style.display = 'none';
    expandGridButton.style.display = 'inline-block';
    expandGridButton.style.visibility = 'visible'; // Pour que le bouton soit visible
    resetGrid(); // Reinstiliser la grille
});

// Fonction pour réinitialiser les paramètres de la grille
function resetGrid() {
    boardElement.style.transform = 'scale(1)';
    taille = 3;
    gridSizeElement.value = taille;
    renderBoard();
    statusElement.textContent = `C'est au tour de ${currentPlayer}`;
}

// Positionner le bouton de réduction en bas de la grille
shrinkGridButton.style.position = 'absolute';
shrinkGridButton.style.bottom = '10px';
shrinkGridButton.style.left = '50%';
shrinkGridButton.style.transform = 'translateX(-50%)';
