// Store the game values in simple variables.
let vitality = 0;
let trashCollected = 0;
let selectedSectionId = 1;

// Get the HTML elements we will update.
const vitalityValue = document.getElementById('vitality-value');
const trashValue = document.getElementById('trash-value');
const environmentStatus = document.getElementById('environment-status');
const bucketButton = document.getElementById('bucket-button');
const world = document.getElementById('world');
const shopButtons = document.querySelectorAll('.shop-button');
const resetButton = document.getElementById('reset-button');

// Each lake section is stored as an object in an array.
const sectionConfigs = [
    { id: 1, row: 1, col: 2, neighbors: [2, 4], unlocked: true, cleaned: false, cleanliness: 0 },
    { id: 2, row: 1, col: 1, neighbors: [1, 3, 5], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 3, row: 1, col: 3, neighbors: [2, 6], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 4, row: 2, col: 1, neighbors: [1, 5], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 5, row: 2, col: 2, neighbors: [2, 4, 6], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 6, row: 2, col: 3, neighbors: [3, 5], unlocked: false, cleaned: false, cleanliness: 0 }
];

const trashIcons = ['🗑️', '🧴', '🧷', '🧼', '🥫'];
let lakeSections = [];

// Create the lake section elements inside the world container.
function buildWorld() {
    world.innerHTML = '';
    lakeSections = sectionConfigs.map((config) => {
        const sectionElement = document.createElement('button');
        sectionElement.type = 'button';
        sectionElement.className = 'lake-section section-dirty';
        sectionElement.dataset.sectionId = config.id;
        sectionElement.style.gridRow = config.row;
        sectionElement.style.gridColumn = config.col;

        sectionElement.innerHTML = `
            <span class="section-label">Section ${config.id}</span>
            <div class="section-trash-layer"></div>
            <span class="section-plants">🌿</span>
            <span class="section-fish">🐟</span>
        `;

        sectionElement.addEventListener('click', () => {
            selectSection(config.id);
        });

        world.appendChild(sectionElement);

        return {
            ...config,
            element: sectionElement,
            trashItems: []
        };
    });

    updateAllSections();
    zoomOut();
}

// Update the HUD so the player can see the current numbers.
function updateUI() {
    vitalityValue.textContent = vitality;
    trashValue.textContent = trashCollected;
    updateEnvironment();
}

// Add one vitality point when the bucket is clicked.
function earnVitality() {
    vitality += 1;
    updateUI();

    bucketButton.classList.remove('active');
    void bucketButton.offsetWidth;
    bucketButton.classList.add('active');

    setTimeout(() => {
        bucketButton.classList.remove('active');
    }, 150);
}

// Select a section so the player can clean it.
function selectSection(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);

    if (!section || !section.unlocked) {
        return;
    }

    selectedSectionId = sectionId;
    updateAllSections();
}

// Update the look of every section using CSS classes.
function updateAllSections() {
    lakeSections.forEach((section) => {
        const isUnlocked = section.unlocked;
        const isClean = section.cleaned;
        const isSelected = section.id === selectedSectionId;

        section.element.classList.toggle('is-locked', !isUnlocked);
        section.element.classList.toggle('is-selected', isUnlocked && isSelected);
        section.element.classList.toggle('section-dirty', isUnlocked && !isClean);
        section.element.classList.toggle('section-clean', isUnlocked && isClean);
    });

    updateUI();
}

// Add random trash pieces to a cleaned section.
function spawnTrashItems(section) {
    const trashLayer = section.element.querySelector('.section-trash-layer');

    if (!trashLayer) {
        return;
    }

    // Clear old trash before placing new pieces.
    trashLayer.innerHTML = '';
    section.trashItems = [];

    const numberOfItems = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < numberOfItems; i += 1) {
        const trashItem = document.createElement('div');
        trashItem.className = 'section-trash-item';
        trashItem.textContent = trashIcons[Math.floor(Math.random() * trashIcons.length)];
        trashItem.style.left = `${15 + Math.random() * 70}%`;
        trashItem.style.top = `${20 + Math.random() * 60}%`;

        trashItem.addEventListener('click', (event) => {
            event.stopPropagation();
            removeTrashItem(section, trashItem);
        });

        trashLayer.appendChild(trashItem);
        section.trashItems.push(trashItem);
    }
}

// Remove a trash item when it is clicked.
function removeTrashItem(section, trashItem) {
    trashItem.remove();
    section.trashItems = section.trashItems.filter((item) => item !== trashItem);
    trashCollected += 1;
    updateUI();
}

// Clean the selected section using vitality points.
function cleanSection(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);

    if (!section || !section.unlocked || section.cleaned) {
        return;
    }

    if (vitality < 20) {
        console.log('Not enough vitality points for Clean Water.');
        return;
    }

    vitality -= 20;
    section.cleanliness = Math.min(100, section.cleanliness + 25);
    section.element.classList.add('section-cleaning');

    setTimeout(() => {
        section.element.classList.remove('section-cleaning');
    }, 400);

    if (section.cleanliness >= 100) {
        section.cleaned = true;
        spawnTrashItems(section);
        trashCollected += 1;
        unlockNextSection(section.id);
    }

    updateAllSections();
}

// Unlock nearby sections when a section is fully cleaned.
function unlockNextSection(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);

    if (!section) {
        return;
    }

    section.neighbors.forEach((neighborId) => {
        const neighbor = lakeSections.find((item) => item.id === neighborId);

        if (neighbor && !neighbor.unlocked) {
            neighbor.unlocked = true;
        }
    });

    zoomOut();
}

// Zoom the world outward as more sections are unlocked.
function zoomOut() {
    const unlockedCount = lakeSections.filter((section) => section.unlocked).length;
    const scale = Math.max(0.72, 1 - (unlockedCount - 1) * 0.08);
    world.style.transform = `scale(${scale})`;
}

// Update the status text with simple beginner-friendly messages.
function updateEnvironment() {
    const cleanedCount = lakeSections.filter((section) => section.cleaned).length;
    const totalCount = lakeSections.length;

    if (cleanedCount === 0) {
        environmentStatus.textContent = 'The first lake section is still dirty and waiting for help.';
    } else if (cleanedCount < totalCount) {
        environmentStatus.textContent = `${cleanedCount} of ${totalCount} lake sections are brighter now.`;
    } else {
        environmentStatus.textContent = 'The whole lake is glowing with life.';
    }
}

// Placeholder function for other upgrades.
function buyUpgrade(upgradeName = 'upgrade') {
    console.log(`${upgradeName} clicked. More features will be added soon.`);
}

// Reset the game back to the starting state.
function resetGame() {
    vitality = 0;
    trashCollected = 0;
    selectedSectionId = 1;

    lakeSections.forEach((section) => {
        section.unlocked = section.id === 1;
        section.cleaned = false;
        section.cleanliness = 0;
        section.trashItems = [];

        const trashLayer = section.element.querySelector('.section-trash-layer');
        if (trashLayer) {
            trashLayer.innerHTML = '';
        }
    });

    zoomOut();
    updateAllSections();
}

// Connect all of the buttons and interactive items.
function setupEvents() {
    bucketButton.addEventListener('click', earnVitality);

    shopButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const upgradeName = button.dataset.upgrade;

            if (upgradeName === 'Clean Water') {
                cleanSection(selectedSectionId);
            } else {
                buyUpgrade(upgradeName);
            }
        });
    });

    resetButton.addEventListener('click', resetGame);
}

// Start the game.
buildWorld();
setupEvents();
updateUI();
