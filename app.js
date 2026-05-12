// ============================================================
//  GRINDR — app.js
//  All JavaScript logic: state, rendering, events, storage
// ============================================================


// ------------------------------------------------------------
// 1. DATA — Class Hierarchy Tiers
//    Single linear path: no path choice, everyone follows this
// ------------------------------------------------------------
const CLASS_TIERS = [
  { xp: 0,   title: 'Wanderer',   emoji: '🧝', tier: 0 },
  { xp: 50,  title: 'Squire',     emoji: '⚔',  tier: 1 },
  { xp: 150, title: 'Warrior',    emoji: '🗡',  tier: 2 },
  { xp: 300, title: 'Knight',     emoji: '🛡',  tier: 3 },
  { xp: 500, title: 'Champion',   emoji: '🏆',  tier: 4 },
  { xp: 800, title: 'Warlord',    emoji: '👑',  tier: 5 },
];


// ------------------------------------------------------------
// 2. DATA — Achievements / Badges
//    Each badge has:
//      id       - unique string key saved in localStorage
//      icon     - emoji shown in UI
//      name     - short title
//      desc     - full description shown in achievement panel
//      howto    - short unlock condition label
//      check(s) - function that returns true when earned
//      progress(s) - returns { cur, max } for progress bar
// ------------------------------------------------------------
const BADGES = [
  {
    id: 'first',
    icon: '🌟',
    name: 'First Blood',
    desc: 'Complete your very first quest and take the first step on your journey.',
    howto: 'Complete 1 quest',
    check: (s) => s.totalDone >= 1,
    progress: (s) => ({ cur: Math.min(s.totalDone, 1), max: 1 }),
  },
  {
    id: 'ten',
    icon: '⚔',
    name: 'Veteran',
    desc: 'A true veteran — complete 10 quests total across your adventure.',
    howto: 'Complete 10 quests',
    check: (s) => s.totalDone >= 10,
    progress: (s) => ({ cur: Math.min(s.totalDone, 10), max: 10 }),
  },
  {
    id: 'hundred',
    icon: '💪',
    name: 'Iron Will',
    desc: 'Relentless dedication — 100 quests completed without giving up.',
    howto: 'Complete 100 quests',
    check: (s) => s.totalDone >= 100,
    progress: (s) => ({ cur: Math.min(s.totalDone, 100), max: 100 }),
  },
  {
    id: 'streak3',
    icon: '🔥',
    name: 'On Fire',
    desc: 'Maintain a 3-day streak by completing at least one quest every day for 3 days straight.',
    howto: '3-day streak',
    check: (s) => s.streak >= 3,
    progress: (s) => ({ cur: Math.min(s.streak, 3), max: 3 }),
  },
  {
    id: 'streak7',
    icon: '⚡',
    name: 'Unstoppable',
    desc: 'Seven days of consistent questing — a full week of unbroken discipline.',
    howto: '7-day streak',
    check: (s) => s.streak >= 7,
    progress: (s) => ({ cur: Math.min(s.streak, 7), max: 7 }),
  },
  {
    id: 'streak30',
    icon: '🌙',
    name: 'Moonwalker',
    desc: 'A 30-day streak — an entire month of showing up every single day without fail.',
    howto: '30-day streak',
    check: (s) => s.streak >= 30,
    progress: (s) => ({ cur: Math.min(s.streak, 30), max: 30 }),
  },
  {
    id: 'streak365',
    icon: '👑',
    name: 'Legendary',
    desc: 'The pinnacle of discipline — stay active every day for an entire year. A true legend.',
    howto: '365-day streak',
    check: (s) => s.streak >= 365,
    progress: (s) => ({ cur: Math.min(s.streak, 365), max: 365 }),
  },
  {
    id: 'lv5',
    icon: '🏆',
    name: 'Rising Star',
    desc: 'Reach Level 5 by accumulating enough XP through completing daily quests.',
    howto: 'Reach Level 5',
    check: (s) => s.level >= 5,
    progress: (s) => ({ cur: Math.min(s.level, 5), max: 5 }),
  },
  {
    id: 'tier3',
    icon: '🛡',
    name: 'Class Master',
    desc: 'Evolve your class to Tier 3 — Knight — by earning 300 total XP.',
    howto: 'Reach Tier 3 (300 XP)',
    check: (s) => s.totalXP >= 300,
    progress: (s) => ({ cur: Math.min(s.totalXP, 300), max: 300 }),
  },
  {
    id: 'xp500',
    icon: '💎',
    name: 'Arcane Power',
    desc: 'Accumulate 500 total XP — a testament to your tireless grind.',
    howto: 'Earn 500 total XP',
    check: (s) => s.totalXP >= 500,
    progress: (s) => ({ cur: Math.min(s.totalXP, 500), max: 500 }),
  },
  {
    id: 'days30',
    icon: '📅',
    name: 'Devoted',
    desc: 'Complete quests on 30 separate days — showing up for an entire month of adventuring.',
    howto: '30 days active',
    check: (s) => (s.daysActive || 0) >= 30,
    progress: (s) => ({ cur: Math.min(s.daysActive || 0, 30), max: 30 }),
  },
  {
    id: 'maxpath',
    icon: '🌌',
    name: 'Transcendent',
    desc: 'Reach the pinnacle rank — Warlord — the rarest title, earned at 800 total XP.',
    howto: 'Reach Tier 5 (800 XP)',
    check: (s) => s.totalXP >= 800,
    progress: (s) => ({ cur: Math.min(s.totalXP, 800), max: 800 }),
  },
];


// ------------------------------------------------------------
// 3. DATA — Random quest icons pool
// ------------------------------------------------------------
const QUEST_ICONS = ['⚔', '🏹', '🔮', '🛡', '🗡', '🌿', '📜', '🔥', '💧', '⚡', '🗝', '🏆'];


// ------------------------------------------------------------
// 4. STATE — Load from localStorage or create fresh default
// ------------------------------------------------------------

/**
 * load() — reads saved JSON from localStorage
 * Uses JSON.parse to convert the stored string back to an object
 * Returns null if nothing is saved yet
 */
function load() {
  try {
    return JSON.parse(localStorage.getItem('grindr_save') || 'null');
  } catch (e) {
    return null;
  }
}

/**
 * save(state) — writes current state to localStorage
 * Uses JSON.stringify to convert the object to a string
 */
function save(s) {
  localStorage.setItem('grindr_save', JSON.stringify(s));
}

/**
 * defaultState() — returns a fresh game state object
 * This is the shape of ALL data the app uses
 */
function defaultState() {
  return {
    name: 'Unnamed Hero',
    level: 1,
    xp: 0,
    totalXP: 0,
    totalDone: 0,
    streak: 0,
    daysActive: 0,
    lastTier: 0,
    badges: [],                   // array of earned badge ids
    log: ['Your adventure begins...'],
    quests: [
      { id: 1, name: 'Exercise for 20 minutes',  xp: 20, done: false, streak: 0, icon: '⚔' },
      { id: 2, name: 'Read for 30 minutes',       xp: 20, done: false, streak: 0, icon: '📜' },
      { id: 3, name: 'Drink 8 glasses of water',  xp: 10, done: false, streak: 0, icon: '💧' },
    ],
    nextId: 4,
  };
}

// Load saved state or start fresh
let state = load() || defaultState();


// ------------------------------------------------------------
// 5. HELPER FUNCTIONS
// ------------------------------------------------------------

/**
 * xpForLevel(level) — XP needed to reach the next level
 * Formula: level * 100  (so Level 1 needs 100, Level 2 needs 200...)
 */
function xpForLevel(level) {
  return level * 100;
}

/**
 * getCurrentTier() — figures out what tier the player is at
 * Uses a for...of loop to walk through CLASS_TIERS
 * Returns the highest tier where totalXP >= tier.xp
 */
function getCurrentTier() {
  let current = CLASS_TIERS[0];
  for (const tier of CLASS_TIERS) {
    if (state.totalXP >= tier.xp) {
      current = tier;
    }
  }
  return current;
}

/**
 * addXP(amount) — adds XP, handles level-ups and tier-ups
 * Demonstrates: while loop, compound assignment, comparisons
 */
function addXP(amount) {
  state.xp += amount;
  state.totalXP += amount;

  // Level up loop — keep leveling while XP overflows
  let leveled = false;
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level++;
    leveled = true;
  }

  // Check for tier / class evolution
  const newTier = getCurrentTier().tier;
  if (newTier > (state.lastTier || 0)) {
    state.lastTier = newTier;
    const t = getCurrentTier();
    showNotification('CLASS UP! You are now ' + t.title + ' ' + t.emoji);
    state.log.push('Class evolved to <span>' + t.title + ' ' + t.emoji + '</span>!');
  }

  return leveled;
}

/**
 * showNotification(msg) — displays the yellow banner briefly
 * Uses setTimeout (BOM) to auto-hide it after 2.8 seconds
 */
function showNotification(msg) {
  const el = document.getElementById('notifyMsg');
  el.textContent = msg;
  el.style.display = 'block';
  // Reset animation by removing and re-adding it
  el.style.animation = 'none';
  void el.offsetWidth; // force browser reflow
  el.style.animation = 'fadeInOut 2.8s forwards';
  // BOM: setTimeout hides the element after 2800ms
  setTimeout(() => {
    el.style.display = 'none';
  }, 2800);
}

/**
 * checkBadges() — loops through all badges and unlocks any newly earned
 * Uses Array.forEach and a check() function on each badge
 */
function checkBadges() {
  BADGES.forEach((badge) => {
    const alreadyEarned = state.badges.includes(badge.id);
    if (!alreadyEarned && badge.check(state)) {
      state.badges.push(badge.id);
      state.log.push('Achievement unlocked: <span>' + badge.name + '</span>!');
    }
  });
}


// ------------------------------------------------------------
// 6. EVENT HANDLERS — called directly from HTML onclick=""
// ------------------------------------------------------------

/**
 * saveChar() — reads the name input and saves it to state
 * DOM: getElementById, .value, .trim()
 */
function saveChar() {
  const nameInput = document.getElementById('nameInput');
  const name = nameInput.value.trim();
  if (name) {
    state.name = name;
    state.log.push('Hero named <span>' + name + '</span>');
  }
  save(state);
  render();
}

/**
 * addQuest() — creates a new quest from the input fields
 * DOM: reads input value and select value
 * Arrays: pushes a new object into state.quests
 */
function addQuest() {
  const input = document.getElementById('questInput');
  const name = input.value.trim();
  if (!name) return; // guard: do nothing if empty

  const xp = parseInt(document.getElementById('xpSelect').value);
  // Pick a random icon from the pool using Math.random()
  const icon = QUEST_ICONS[Math.floor(Math.random() * QUEST_ICONS.length)];

  // Destructuring: build new quest object
  const newQuest = { id: state.nextId++, name, xp, done: false, streak: 0, icon };
  state.quests.push(newQuest);

  state.log.push('New quest added: <span>' + name + '</span>');
  input.value = ''; // clear the input
  save(state);
  render();
}

/**
 * completeQuest(id) — marks a quest done, awards XP
 * Arrays: .find() to locate quest by id
 */
function completeQuest(id) {
  // Array.find() — returns the first element matching the condition
  const quest = state.quests.find((q) => q.id === id);
  if (!quest || quest.done) return;

  quest.done = true;
  quest.streak++;
  state.totalDone++;

  const leveled = addXP(quest.xp);
  state.log.push('<span>' + quest.name + '</span> completed! +' + quest.xp + ' XP');

  if (leveled) {
    showNotification('LEVEL UP! You are now Level ' + state.level + '!');
    state.log.push('Level up! Now Level <span>' + state.level + '</span>');
  }

  checkBadges();
  save(state);
  render();

  // Animate the XP text using CSS class + BOM reflow trick
  const xpEl = document.getElementById('xpText');
  xpEl.classList.remove('flash');
  void xpEl.offsetWidth;
  xpEl.classList.add('flash');
}

/**
 * deleteQuest(id) — removes a quest from the array
 * Arrays: .filter() returns a new array excluding the deleted quest
 */
function deleteQuest(id) {
  // Array.filter() — keeps only quests whose id does NOT match
  state.quests = state.quests.filter((q) => q.id !== id);
  save(state);
  render();
}

/**
 * resetDay() — called when starting a new day
 * Updates streak, resets quest completion, saves state
 */
function resetDay() {
  const anyDone = state.quests.some((q) => q.done);

  if (anyDone) {
    state.streak++;
    state.daysActive = (state.daysActive || 0) + 1;
    state.log.push('Day complete! Streak: <span>' + state.streak + ' days</span>');
  } else {
    state.streak = 0;
    state.log.push('Day reset. No quests done — streak lost.');
  }

  // Reset each quest: clear done flag, reset streak if not completed
  state.quests.forEach((quest) => {
    if (!quest.done) quest.streak = 0;
    quest.done = false;
  });

  checkBadges();
  save(state);
  render();
}


// ------------------------------------------------------------
// 7. RENDER FUNCTIONS — update the DOM to match state
//    This is the core of "DOM Manipulation"
// ------------------------------------------------------------

/**
 * render() — master render function, calls all sub-renders
 * Updates every piece of the UI from the current state object
 */
function render() {
  const tier = getCurrentTier();

  // Update hero panel
  document.getElementById('charAvatar').textContent = tier.emoji;
  document.getElementById('charName').textContent = state.name;
  document.getElementById('charClass').textContent = tier.title + ' — Tier ' + tier.tier;

  // Next tier info
  const nextTier = CLASS_TIERS[tier.tier + 1];
  document.getElementById('charTier').textContent = tier.tier === 5
    ? 'MAX RANK — You have reached the pinnacle!'
    : 'Next rank: ' + nextTier.title + ' at ' + nextTier.xp + ' XP';

  // XP bar — calculate percentage with Math.round
  const needed = xpForLevel(state.level);
  const pct = Math.min(100, Math.round((state.xp / needed) * 100));
  document.getElementById('xpBar').style.width = pct + '%';
  document.getElementById('xpText').textContent =
    state.xp + ' / ' + needed + ' XP  (Total earned: ' + state.totalXP + ')';

  // Level badge
  document.getElementById('levelNum').textContent = state.level;

  // Stats
  document.getElementById('statTotal').textContent = state.totalDone;
  document.getElementById('statStreak').textContent = state.streak;
  document.getElementById('statXPTotal').textContent = state.totalXP;
  document.getElementById('statDays').textContent = state.daysActive || 0;

  // Pre-fill name input if already saved
  if (state.name !== 'Unnamed Hero') {
    document.getElementById('nameInput').value = state.name;
  }

  // Call sub-renders
  renderTierProgress();
  renderQuests();
  renderBadges();
  renderLog();
}

/**
 * renderTierProgress() — builds the class hierarchy list
 * Uses Array.map() to convert data into HTML strings
 */
function renderTierProgress() {
  const currentTier = getCurrentTier().tier;

  // Array.map() — transforms each tier object into an HTML string
  const html = CLASS_TIERS.map((t) => {
    const reached = state.totalXP >= t.xp;
    const isCurrent = t.tier === currentTier;
    const dotClass = isCurrent ? 'current' : reached ? 'reached' : '';
    const nameClass = isCurrent ? 'current' : reached ? 'reached' : '';

    return `
      <div class="tier-row">
        <div class="tier-dot ${dotClass}"></div>
        <div class="tier-name ${nameClass}">Tier ${t.tier} — ${t.emoji} ${t.title}</div>
        <div class="tier-xp">${t.xp} XP</div>
      </div>
    `;
  }).join(''); // join converts array of strings into one big string

  document.getElementById('tierProgress').innerHTML = html;
}

/**
 * renderQuests() — builds the quest list HTML
 * Uses Array.map() + template literals
 * Demonstrates: conditional (ternary) operator, template strings
 */
function renderQuests() {
  const el = document.getElementById('questList');

  if (state.quests.length === 0) {
    el.innerHTML = '<div style="color:#c4a878;font-style:italic;font-size:15px;padding:8px 0">No quests yet. Add one below!</div>';
    return;
  }

  // Array.map() over quests array — each quest becomes an HTML card
  const html = state.quests.map((quest) => {
    const doneClass = quest.done ? 'done' : '';
    const btnClass = quest.done ? 'complete-btn done-btn' : 'complete-btn';
    const btnText = quest.done ? '✓ Done' : 'Complete';
    const streakText = quest.streak > 0
      ? '🔥 ' + quest.streak + '-day streak'
      : 'Start your streak today';

    return `
      <div class="quest-item ${doneClass}">
        <div class="quest-icon">${quest.icon}</div>
        <div class="quest-info">
          <div class="quest-name">${quest.name}</div>
          <div class="quest-xp">+${quest.xp} XP</div>
          <div class="quest-streak">${streakText}</div>
        </div>
        <button class="${btnClass}"
                onclick="completeQuest(${quest.id})"
                ${quest.done ? 'disabled' : ''}>
          ${btnText}
        </button>
        <button class="delete-btn" onclick="deleteQuest(${quest.id})">✕</button>
      </div>
    `;
  }).join('');

  el.innerHTML = html;
}

/**
 * renderBadges() — builds the achievements panel
 * Uses Array.map() and destructuring on each badge
 */
function renderBadges() {
  const html = BADGES.map((badge) => {
    // Destructuring: pull properties out of the badge object
    const { id, icon, name, desc, howto, progress } = badge;

    const earned = state.badges.includes(id);
    const rowClass = earned ? 'earned' : 'locked';

    // Progress bar
    const prog = progress(state);
    const pct = Math.round((prog.cur / prog.max) * 100);

    const statusText = earned
      ? '✓ Unlocked'
      : howto + ' — ' + prog.cur + ' / ' + prog.max;

    return `
      <div class="badge-row ${rowClass}">
        <div class="badge-emoji">${icon}</div>
        <div class="badge-text">
          <div class="badge-name">${name}</div>
          <div class="badge-desc">${desc}</div>
          <div class="badge-progress-wrap">
            <div class="badge-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="badge-status">${statusText}</div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('badgesGrid').innerHTML = html;
}

/**
 * renderLog() — shows the last 15 chronicle entries
 * Uses spread operator, Array.reverse(), Array.slice()
 */
function renderLog() {
  // Spread [...] creates a copy so we don't mutate the original
  const recent = [...state.log].reverse().slice(0, 15);

  const html = recent.map((entry) => {
    return `<div class="log-item">${entry}</div>`;
  }).join('');

  document.getElementById('logList').innerHTML = html;
}


// ------------------------------------------------------------
// 8. INIT — run render on page load
// ------------------------------------------------------------
render();
