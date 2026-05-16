/**
 * AI Maze Solver — Frontend Controller
 * Handles maze interaction, API calls, and visualization animations.
 */

// ===== State =====
const state = {
  maze: [],
  rows: 21,
  cols: 21,
  start: [1, 1],
  goal: [19, 19],
  drawMode: "wall",
  selectedAlgo: "bfs",
  isDrawing: false,
  isSolving: false,
  animationSpeed: 50,
  animationTimers: [],
  pointerId: null,
  soundEnabled: true,
  theme: "dark",
  typingToken: 0,
  typingTimer: null,
  audioCtx: null,
  particle: null,
  weights: [],
  weightLevel: 3,
  heatmapEnabled: false,
  raceMode: false,
  debugMode: false,
  gameMode: false,
  raceTimers: [],
  raceCells: {},
  debug: { events: [], index: 0, running: false, timer: null },
  lastResult: null,
  compareResults: null,
  player: { active: false, pos: null, steps: 0 },
};

// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const mazeGrid = $("#maze-grid");
const statusText = $("#status-text");
const statusBar = $("#status-bar");
const sizeSlider = $("#maze-size");
const sizeLabel = $("#size-label");
const speedSlider = $("#speed-slider");
const speedLabel = $("#speed-label");
const soundToggle = $("#sound-toggle");
const themeToggle = $("#theme-toggle");
const heatmapToggle = $("#heatmap-toggle");
const gameToggle = $("#game-toggle");
const raceToggle = $("#race-toggle");
const debugToggle = $("#debug-toggle");
const presetSelect = $("#preset-select");
const presetApplyBtn = $("#btn-apply-preset");
const exportBtn = $("#btn-export");
const shareBtn = $("#btn-share");
const weightSlider = $("#weight-level");
const weightLabel = $("#weight-label");
const raceContainer = $("#race-container");
const debugBar = $("#debug-bar");
const debugPlayBtn = $("#btn-debug-play");
const debugPauseBtn = $("#btn-debug-pause");
const debugBackBtn = $("#btn-debug-back");
const debugForwardBtn = $("#btn-debug-forward");
const debugEndBtn = $("#btn-debug-end");
const raceBtn = $("#btn-race");
const debuggerBtn = $("#btn-debugger");
const radarCanvas = $("#radar-chart");
const radarLegend = $("#radar-legend");
const particleCanvas = $("#particle-canvas");

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  initPreferences();
  initControls();
  initShortcuts();
  initRipples();
  initParticles();
  initPresets();
  initModeToggles();
  initDebuggerControls();
  initShareAndExport();
  if (!loadFromHash()) {
    generateMaze();
  }
});

function initPreferences() {
  const savedTheme = localStorage.getItem("mazeTheme");
  if (savedTheme === "light") {
    state.theme = "light";
    document.body.classList.add("theme-light");
  }

  const savedSound = localStorage.getItem("mazeSound");
  if (savedSound === "off") {
    state.soundEnabled = false;
  }

  state.heatmapEnabled = localStorage.getItem("mazeHeatmap") === "on";
  state.raceMode = localStorage.getItem("mazeRace") === "on";
  state.debugMode = localStorage.getItem("mazeDebug") === "on";
  state.gameMode = localStorage.getItem("mazeGame") === "on";

  if (themeToggle) themeToggle.checked = state.theme === "light";
  if (soundToggle) soundToggle.checked = state.soundEnabled;
  if (heatmapToggle) heatmapToggle.checked = state.heatmapEnabled;
  if (raceToggle) raceToggle.checked = state.raceMode;
  if (debugToggle) debugToggle.checked = state.debugMode;
  if (gameToggle) gameToggle.checked = state.gameMode;
}

function initControls() {
  // Maze size slider
  sizeSlider.addEventListener("input", () => {
    const val = parseInt(sizeSlider.value);
    sizeLabel.textContent = `${val}×${val}`;
  });

  // Speed slider
  speedSlider.addEventListener("input", () => {
    state.animationSpeed = parseInt(speedSlider.value);
    speedLabel.textContent = `${state.animationSpeed}%`;
  });

  if (weightSlider) {
    weightSlider.addEventListener("input", () => {
      state.weightLevel = parseInt(weightSlider.value);
      if (weightLabel) weightLabel.textContent = `${state.weightLevel}`;
    });
  }

  // Buttons
  $("#btn-generate").addEventListener("click", generateMaze);
  $("#btn-clear").addEventListener("click", clearMaze);
  $("#btn-solve").addEventListener("click", solveMaze);
  $("#btn-compare").addEventListener("click", compareAll);
  $("#btn-reset-viz").addEventListener("click", resetVisualization);
  if (raceBtn) raceBtn.addEventListener("click", runRace);
  if (debuggerBtn) debuggerBtn.addEventListener("click", startDebuggerFromUI);
  if (presetApplyBtn) presetApplyBtn.addEventListener("click", applyPreset);
  if (exportBtn) exportBtn.addEventListener("click", exportMazePng);
  if (shareBtn) shareBtn.addEventListener("click", shareLink);

  if (soundToggle) {
    soundToggle.addEventListener("change", () => {
      state.soundEnabled = soundToggle.checked;
      localStorage.setItem("mazeSound", state.soundEnabled ? "on" : "off");
      if (state.soundEnabled) playSound("toggle");
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      state.theme = themeToggle.checked ? "light" : "dark";
      document.body.classList.toggle("theme-light", state.theme === "light");
      localStorage.setItem("mazeTheme", state.theme);
      updateParticleColors();
      playSound("toggle");
    });
  }

  // Draw mode buttons
  $$(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.drawMode = btn.dataset.mode;
    });
  });

  // Algorithm selection
  $$(".algo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectAlgorithm(btn.dataset.algo);
    });
  });
}

function initPresets() {
  if (!presetSelect) return;
  if (weightLabel) weightLabel.textContent = `${state.weightLevel}`;
}

function initModeToggles() {
  if (heatmapToggle) {
    heatmapToggle.addEventListener("change", () => {
      state.heatmapEnabled = heatmapToggle.checked;
      localStorage.setItem("mazeHeatmap", state.heatmapEnabled ? "on" : "off");
      if (state.lastResult) {
        if (state.heatmapEnabled) {
          applyHeatmap(state.lastResult);
        } else {
          applyResultStatic(state.lastResult);
        }
      }
    });
  }

  if (raceToggle) {
    raceToggle.addEventListener("change", () => {
      setRaceMode(raceToggle.checked);
    });
  }

  if (debugToggle) {
    debugToggle.addEventListener("change", () => {
      state.debugMode = debugToggle.checked;
      localStorage.setItem("mazeDebug", state.debugMode ? "on" : "off");
      if (debugBar) debugBar.classList.toggle("active", state.debugMode);
      if (!state.debugMode) {
        stopDebugger();
      }
    });
  }

  if (gameToggle) {
    gameToggle.addEventListener("change", () => {
      setGameMode(gameToggle.checked);
    });
  }

  setRaceMode(state.raceMode, true);
  if (debugBar) debugBar.classList.toggle("active", state.debugMode);
  if (state.gameMode) setGameMode(true, true);
}

function initDebuggerControls() {
  if (debugPlayBtn) debugPlayBtn.addEventListener("click", debugPlay);
  if (debugPauseBtn) debugPauseBtn.addEventListener("click", debugPause);
  if (debugBackBtn) debugBackBtn.addEventListener("click", debugStepBack);
  if (debugForwardBtn)
    debugForwardBtn.addEventListener("click", debugStepForward);
  if (debugEndBtn) debugEndBtn.addEventListener("click", debugToEnd);
}

function initShareAndExport() {
  if (exportBtn) exportBtn.addEventListener("click", exportMazePng);
  if (shareBtn) shareBtn.addEventListener("click", shareLink);
}

function initShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    const target = e.target;
    if (target && target.closest("input, textarea, select")) return;

    const key = e.key.toLowerCase();
    if (state.gameMode) {
      if (key === "arrowup" || key === "w") return movePlayer(-1, 0);
      if (key === "arrowdown" || key === "s") return movePlayer(1, 0);
      if (key === "arrowleft" || key === "a") return movePlayer(0, -1);
      if (key === "arrowright" || key === "d") return movePlayer(0, 1);
    }
    if (key === "g") {
      generateMaze();
    } else if (key === "s") {
      solveMaze();
    } else if (key === "c") {
      compareAll();
    } else if (key === "r") {
      resetVisualization();
      setStatus("Visualization reset.", "");
    } else if (key === "1") {
      selectAlgorithm("bfs");
    } else if (key === "2") {
      selectAlgorithm("dfs");
    } else if (key === "3") {
      selectAlgorithm("ids");
    } else if (key === "4") {
      selectAlgorithm("astar");
    }
  });
}

function initRipples() {
  const targets = document.querySelectorAll(".btn");
  targets.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });
}

// ===== Maze Generation =====
async function generateMaze() {
  if (state.isSolving) return;
  stopRace();
  stopDebugger();
  const size = parseInt(sizeSlider.value);
  setStatus("Generating maze...", "solving");
  playSound("action");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: size, cols: size }),
    });
    const data = await res.json();
    state.maze = data.maze;
    state.rows = data.rows;
    state.cols = data.cols;
    state.start = data.start;
    state.goal = data.goal;
    state.weights = createWeightGrid(state.rows, state.cols, 1);
    state.lastResult = null;
    state.compareResults = null;
    if (state.gameMode) {
      state.player.pos = [...state.start];
      state.player.steps = 0;
      updatePlayerStat();
    }
    renderMaze();
    clearStats();
    setStatus(
      `Maze generated (${state.rows}×${state.cols}). Choose an algorithm and click Solve!`,
      "",
    );
    playSound("success");
  } catch (e) {
    setStatus("Error generating maze. Is the server running?", "error");
    playSound("error");
  }
}

function clearMaze() {
  if (state.isSolving) return;
  stopRace();
  stopDebugger();
  cancelAnimations();
  const size = parseInt(sizeSlider.value);
  // Ensure odd
  const rows = size % 2 === 0 ? size + 1 : size;
  const cols = rows;
  state.rows = rows;
  state.cols = cols;
  state.maze = Array.from({ length: rows }, () => Array(cols).fill(0));
  state.weights = createWeightGrid(rows, cols, 1);
  state.start = [1, 1];
  state.goal = [rows - 2, cols - 2];
  state.lastResult = null;
  state.compareResults = null;
  if (state.gameMode) {
    state.player.pos = [...state.start];
    state.player.steps = 0;
    updatePlayerStat();
  }
  renderMaze();
  clearStats();
  setStatus("Empty grid. Draw walls, set start/goal, then solve!", "");
  playSound("action");
}

// ===== Maze Rendering =====
function renderMaze() {
  cancelAnimations();
  mazeGrid.innerHTML = "";

  if (!state.weights || state.weights.length !== state.rows) {
    state.weights = createWeightGrid(state.rows, state.cols, 1);
  }
  if (state.gameMode && !state.player.pos) {
    state.player.pos = [...state.start];
  }

  // Calculate cell size to fit container
  const container = $("#maze-container");
  const maxWidth = container.clientWidth - 20;
  const maxHeight = container.clientHeight - 20;
  const cellSize = Math.max(
    8,
    Math.min(
      Math.floor(maxWidth / state.cols),
      Math.floor(maxHeight / state.rows),
      30,
    ),
  );

  mazeGrid.style.gridTemplateColumns = `repeat(${state.cols}, ${cellSize}px)`;
  mazeGrid.style.gridTemplateRows = `repeat(${state.rows}, ${cellSize}px)`;

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      updateCellClass(cell, r, c);

      // Drawing events (mouse + touch)
      cell.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        state.isDrawing = true;
        state.pointerId = e.pointerId;
        if (cell.setPointerCapture) cell.setPointerCapture(e.pointerId);
        handleCellDraw(r, c);
      });
      cell.addEventListener("pointerenter", (e) => {
        if (state.isDrawing && state.pointerId === e.pointerId) {
          handleCellDraw(r, c);
        }
      });

      mazeGrid.appendChild(cell);
    }
  }

  // Global pointer up
  document.addEventListener("pointerup", (e) => {
    if (state.pointerId === null || state.pointerId === e.pointerId) {
      state.isDrawing = false;
      state.pointerId = null;
    }
  });
}

function updateCellClass(cell, r, c) {
  cell.className = "cell";
  if (state.player.active && state.player.pos) {
    if (r === state.player.pos[0] && c === state.player.pos[1]) {
      cell.classList.add("cell-player");
      return;
    }
  }
  if (r === state.start[0] && c === state.start[1]) {
    cell.classList.add("cell-start");
  } else if (r === state.goal[0] && c === state.goal[1]) {
    cell.classList.add("cell-goal");
  } else if (state.maze[r][c] === 1) {
    cell.classList.add("cell-wall");
  } else {
    cell.classList.add("cell-open");
    const weight = state.weights?.[r]?.[c] || 1;
    if (weight > 1) {
      cell.classList.add("cell-weight");
      if (weight >= 6) {
        cell.classList.add("cell-weight-6");
      } else if (weight >= 3) {
        cell.classList.add("cell-weight-3");
      }
    }
  }
}

function getCell(r, c) {
  return mazeGrid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function handleCellDraw(r, c) {
  if (state.isSolving) return;
  if (state.gameMode) return;
  state.lastResult = null;
  state.compareResults = null;
  resetVisualization();

  switch (state.drawMode) {
    case "wall":
      if (
        !(r === state.start[0] && c === state.start[1]) &&
        !(r === state.goal[0] && c === state.goal[1])
      ) {
        state.maze[r][c] = 1;
        if (state.weights?.[r]) state.weights[r][c] = 1;
      }
      break;
    case "erase":
      state.maze[r][c] = 0;
      if (state.weights?.[r]) state.weights[r][c] = 1;
      break;
    case "start":
      state.maze[state.start[0]][state.start[1]] = 0;
      if (state.weights?.[state.start[0]])
        state.weights[state.start[0]][state.start[1]] = 1;
      const oldStart = getCell(state.start[0], state.start[1]);
      if (oldStart) updateCellClass(oldStart, state.start[0], state.start[1]);
      state.start = [r, c];
      state.maze[r][c] = 0;
      if (state.weights?.[r]) state.weights[r][c] = 1;
      break;
    case "goal":
      state.maze[state.goal[0]][state.goal[1]] = 0;
      if (state.weights?.[state.goal[0]])
        state.weights[state.goal[0]][state.goal[1]] = 1;
      const oldGoal = getCell(state.goal[0], state.goal[1]);
      if (oldGoal) updateCellClass(oldGoal, state.goal[0], state.goal[1]);
      state.goal = [r, c];
      state.maze[r][c] = 0;
      if (state.weights?.[r]) state.weights[r][c] = 1;
      break;
    case "weight":
      if (
        !(r === state.start[0] && c === state.start[1]) &&
        !(r === state.goal[0] && c === state.goal[1])
      ) {
        state.maze[r][c] = 0;
        if (state.weights?.[r]) state.weights[r][c] = state.weightLevel;
      }
      break;
  }
  const cell = getCell(r, c);
  if (cell) updateCellClass(cell, r, c);
}

// ===== Solving =====
async function solveMaze() {
  if (state.isSolving) return;
  resetVisualization();
  state.isSolving = true;

  const btn = $("#btn-solve");
  btn.classList.add("solving");
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Solving...`;
  setStatus(`Running ${algoDisplayName(state.selectedAlgo)}...`, "solving");
  playSound("solve-start");

  try {
    const result = await requestSolve(state.selectedAlgo);
    state.lastResult = result;
    updateStats(result);
    if (state.debugMode) {
      startDebugger(result);
    } else {
      await animateSolution(result);
      if (state.heatmapEnabled) applyHeatmap(result);
    }

    if (result.found) {
      setStatus(
        `${algoDisplayName(state.selectedAlgo)}: Path found! Cost: ${result.cost}, Nodes explored: ${result.nodes_explored}`,
        "success",
      );
      playSound("solve-success");
    } else {
      setStatus(
        `${algoDisplayName(state.selectedAlgo)}: No path found. Explored ${result.nodes_explored} nodes.`,
        "error",
      );
      playSound("solve-fail");
    }
  } catch (e) {
    setStatus("Error solving maze. Check server connection.", "error");
    playSound("error");
  }

  btn.classList.remove("solving");
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Solve`;
  state.isSolving = false;
}

// ===== Compare All =====
async function compareAll() {
  if (state.isSolving) return;
  resetVisualization();
  state.isSolving = true;

  const btn = $("#btn-compare");
  btn.classList.add("solving");
  setStatus("Comparing all algorithms...", "solving");
  playSound("action");

  try {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maze: state.maze,
        start: state.start,
        goal: state.goal,
        weights: state.weights,
      }),
    });
    const results = await res.json();
    renderComparisonTable(results);
    renderBarChart(results);
    renderRadarChart(results);
    state.compareResults = results;

    // Animate A* result (best visual)
    if (results.astar) {
      updateStats(results.astar);
      state.lastResult = results.astar;
      await animateSolution(results.astar);
      if (state.heatmapEnabled) applyHeatmap(results.astar);
    }

    setStatus(
      "Comparison complete! Check the table on the right panel.",
      "success",
    );
    playSound("success");
  } catch (e) {
    setStatus("Error comparing algorithms.", "error");
    playSound("error");
  }

  btn.classList.remove("solving");
  state.isSolving = false;
}

// ===== Animation =====
function getAnimDelay() {
  // Map speed 1-100 to delay in ms (200ms to 2ms)
  return Math.max(2, Math.round(200 - (state.animationSpeed / 100) * 198));
}

function animateSolution(result) {
  return new Promise((resolve) => {
    const delay = getAnimDelay();
    const explored = result.explored || [];
    const path = result.path || [];
    let i = 0;

    // Animate explored nodes
    function animateExplored() {
      if (i < explored.length) {
        const [r, c] = explored[i];
        if (
          !(r === state.start[0] && c === state.start[1]) &&
          !(r === state.goal[0] && c === state.goal[1])
        ) {
          const cell = getCell(r, c);
          if (cell) {
            cell.className = "cell cell-explored";
          }
        }
        i++;
        const timer = setTimeout(animateExplored, delay);
        state.animationTimers.push(timer);
      } else {
        // Then animate path
        animatePath(path, delay, resolve);
      }
    }
    animateExplored();
  });
}

function animatePath(path, delay, resolve) {
  let j = 0;
  function step() {
    if (j < path.length) {
      const [r, c] = path[j];
      if (
        !(r === state.start[0] && c === state.start[1]) &&
        !(r === state.goal[0] && c === state.goal[1])
      ) {
        const cell = getCell(r, c);
        if (cell) {
          cell.className = "cell cell-path";
        }
      }
      j++;
      const timer = setTimeout(step, delay * 2);
      state.animationTimers.push(timer);
    } else {
      resolve();
    }
  }
  step();
}

function cancelAnimations() {
  state.animationTimers.forEach((t) => clearTimeout(t));
  state.animationTimers = [];
}

function resetVisualization() {
  cancelAnimations();
  clearHeatmap();
  // Reset all explored and path cells back to open
  $$(".cell-explored, .cell-path").forEach((cell) => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    updateCellClass(cell, r, c);
  });
}

// ===== Stats =====
function updateStats(result) {
  $("#stat-algo-value").textContent = algoDisplayName(result.algorithm);
  $("#stat-found-value").textContent = result.found ? "✓ Yes" : "✗ No";
  $("#stat-found-value").style.color = result.found
    ? "var(--accent-green)"
    : "var(--accent-red)";

  animateNumber($("#stat-nodes-value"), result.nodes_explored, 0);
  if (result.found) {
    animateNumber($("#stat-cost-value"), result.cost, 0);
  } else {
    $("#stat-cost-value").textContent = "—";
    $("#stat-cost-value").dataset.value = "0";
  }
  animateNumber($("#stat-time-value"), result.time, 2);

  // Highlight animation
  $$(".stat-card").forEach((card) => {
    card.classList.add("highlight");
    setTimeout(() => card.classList.remove("highlight"), 1500);
  });
}

function clearStats() {
  $("#stat-algo-value").textContent = "—";
  $("#stat-found-value").textContent = "—";
  $("#stat-found-value").style.color = "";
  $("#stat-nodes-value").textContent = "—";
  $("#stat-cost-value").textContent = "—";
  $("#stat-time-value").textContent = "—";
  $("#stat-nodes-value").dataset.value = "0";
  $("#stat-cost-value").dataset.value = "0";
  $("#stat-time-value").dataset.value = "0";
  $("#stat-player-value").textContent = "—";
  $("#comparison-body").innerHTML =
    '<tr><td colspan="4" class="empty-msg">Run "Compare All" to see results</td></tr>';
  $("#bar-chart").innerHTML = "";
  if (radarLegend) radarLegend.innerHTML = "";
  if (radarCanvas) {
    const ctx = radarCanvas.getContext("2d");
    ctx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
  }
}

// ===== Comparison Table =====
function renderComparisonTable(results) {
  const body = $("#comparison-body");
  body.innerHTML = "";

  const algos = ["bfs", "dfs", "ids", "astar"];
  const names = { bfs: "BFS", dfs: "DFS", ids: "IDS", astar: "A*" };

  // Find best values (among those that found a path)
  let minNodes = Infinity,
    minCost = Infinity,
    minTime = Infinity;
  algos.forEach((a) => {
    const r = results[a];
    if (r && r.found) {
      minNodes = Math.min(minNodes, r.nodes_explored);
      minCost = Math.min(minCost, r.cost);
      minTime = Math.min(minTime, r.time);
    }
  });

  algos.forEach((a, index) => {
    const r = results[a];
    if (!r) return;
    const tr = document.createElement("tr");
    tr.className = "comparison-row";
    tr.style.animationDelay = `${index * 60}ms`;

    const tdName = document.createElement("td");
    tdName.className = "algo-name-cell";
    tdName.textContent = names[a];

    const tdNodes = document.createElement("td");
    tdNodes.textContent = r.nodes_explored.toLocaleString();
    if (r.found && r.nodes_explored === minNodes)
      tdNodes.className = "best-value";
    if (!r.found) tdNodes.className = "no-path";

    const tdCost = document.createElement("td");
    tdCost.textContent = r.found ? r.cost : "N/A";
    if (r.found && r.cost === minCost) tdCost.className = "best-value";
    if (!r.found) tdCost.className = "no-path";

    const tdTime = document.createElement("td");
    tdTime.textContent = r.time.toFixed(2);
    if (r.found && r.time === minTime) tdTime.className = "best-value";
    if (!r.found) tdTime.className = "no-path";

    tr.append(tdName, tdNodes, tdCost, tdTime);
    body.appendChild(tr);
  });
}

// ===== Bar Chart =====
function renderBarChart(results) {
  const chart = $("#bar-chart");
  chart.innerHTML = "";

  const algos = ["bfs", "dfs", "ids", "astar"];
  const names = { bfs: "BFS", dfs: "DFS", ids: "IDS", astar: "A*" };
  const colors = {
    bfs: "bar-bfs",
    dfs: "bar-dfs",
    ids: "bar-ids",
    astar: "bar-astar",
  };

  const maxNodes = Math.max(
    ...algos.map((a) => results[a]?.nodes_explored || 0),
    1,
  );

  algos.forEach((a) => {
    const r = results[a];
    if (!r) return;
    const pct = (r.nodes_explored / maxNodes) * 100;

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
            <span class="bar-label">${names[a]}</span>
            <div class="bar-track">
                <div class="bar-fill ${colors[a]}" style="width: 0%">${r.nodes_explored}</div>
            </div>
        `;
    chart.appendChild(row);

    // Animate bar width
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector(".bar-fill").style.width = `${Math.max(pct, 8)}%`;
      });
    });
  });
}

function renderRadarChart(results) {
  if (!radarCanvas) return;
  const ctx = radarCanvas.getContext("2d");
  const width = radarCanvas.width;
  const height = radarCanvas.height;
  ctx.clearRect(0, 0, width, height);

  const metrics = [
    { key: "nodes_explored", label: "Nodes" },
    { key: "cost", label: "Cost" },
    { key: "time", label: "Time" },
  ];
  const algos = ["bfs", "dfs", "ids", "astar"];
  const colors = {
    bfs: "#3b82f6",
    dfs: "#f97316",
    ids: "#8b5cf6",
    astar: "#10b981",
  };

  const maxValues = {};
  metrics.forEach((m) => {
    maxValues[m.key] = 1;
    algos.forEach((a) => {
      const r = results[a];
      if (!r || !r.found) return;
      const value = r[m.key] ?? 0;
      maxValues[m.key] = Math.max(maxValues[m.key], value || 1);
    });
  });

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = Math.min(width, height) / 2 - 30;
  const angleStep = (Math.PI * 2) / metrics.length;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius / 4) * ring;
    ctx.beginPath();
    metrics.forEach((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  metrics.forEach((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + (radius + 14) * Math.cos(angle);
    const y = centerY + (radius + 14) * Math.sin(angle);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(m.label, x, y);
  });

  algos.forEach((algo) => {
    const r = results[algo];
    if (!r) return;
    const points = metrics.map((m, i) => {
      const value = r.found ? (r[m.key] ?? 0) : 0;
      const max = maxValues[m.key] || 1;
      const ratio = max ? value / max : 0;
      const angle = i * angleStep - Math.PI / 2;
      return {
        x: centerX + radius * ratio * Math.cos(angle),
        y: centerY + radius * ratio * Math.sin(angle),
      };
    });

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = colors[algo];
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = `${colors[algo]}33`;
    ctx.fill();
  });

  if (radarLegend) {
    radarLegend.innerHTML = "";
    Object.entries(colors).forEach(([algo, color]) => {
      const item = document.createElement("div");
      item.className = "radar-key";
      item.innerHTML = `<span class="radar-dot" style="background:${color}"></span>${algo.toUpperCase()}`;
      radarLegend.appendChild(item);
    });
  }
}

function createWeightGrid(rows, cols, value) {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}

async function applyPreset() {
  if (!presetSelect) return;
  const preset = presetSelect.value;
  const size = parseInt(sizeSlider.value);
  const rows = size % 2 === 0 ? size + 1 : size;
  const cols = rows;

  if (preset === "random" || preset === "labyrinth") {
    await generateMaze();
    return;
  }

  const maze = Array.from({ length: rows }, () => Array(cols).fill(0));
  let start = [1, 1];
  let goal = [rows - 2, cols - 2];

  if (preset === "spiral") {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        maze[r][c] = 1;
      }
    }
    let top = 1;
    let left = 1;
    let bottom = rows - 2;
    let right = cols - 2;
    let last = [1, 1];
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) {
        maze[top][c] = 0;
        last = [top, c];
      }
      for (let r = top + 1; r <= bottom; r++) {
        maze[r][right] = 0;
        last = [r, right];
      }
      if (top + 1 <= bottom) {
        for (let c = right - 1; c >= left; c--) {
          maze[bottom][c] = 0;
          last = [bottom, c];
        }
      }
      if (left + 1 <= right) {
        for (let r = bottom - 1; r >= top + 2; r--) {
          maze[r][left] = 0;
          last = [r, left];
        }
      }
      top += 2;
      left += 2;
      bottom -= 2;
      right -= 2;
    }
    goal = last;
  }

  if (preset === "no-solution") {
    const [gr, gc] = goal;
    const block = [
      [gr - 1, gc],
      [gr + 1, gc],
      [gr, gc - 1],
      [gr, gc + 1],
    ];
    block.forEach(([r, c]) => {
      if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
        maze[r][c] = 1;
      }
    });
  }

  state.rows = rows;
  state.cols = cols;
  state.maze = maze;
  state.start = start;
  state.goal = goal;
  state.weights = createWeightGrid(rows, cols, 1);
  state.lastResult = null;
  state.compareResults = null;
  if (state.gameMode) {
    state.player.pos = [...state.start];
    state.player.steps = 0;
    updatePlayerStat();
  }
  sizeSlider.value = rows;
  sizeLabel.textContent = `${rows}×${cols}`;
  renderMaze();
  clearStats();
  setStatus(`Preset applied: ${preset.replace("-", " ")}.`, "");
}

function setRaceMode(enabled, silent = false) {
  state.raceMode = enabled;
  if (raceToggle) raceToggle.checked = enabled;
  if (!silent) localStorage.setItem("mazeRace", enabled ? "on" : "off");
  document.body.classList.toggle("race-mode", enabled);
  if (raceContainer) raceContainer.classList.toggle("active", enabled);
  if (!enabled) stopRace();
  if (!silent) playSound("action");
}

async function runRace() {
  if (state.isSolving) return;
  setRaceMode(true);
  stopRace();
  setStatus("Race mode: running all algorithms...", "solving");
  state.isSolving = true;
  try {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maze: state.maze,
        start: state.start,
        goal: state.goal,
        weights: state.weights,
      }),
    });
    const results = await res.json();
    state.compareResults = results;
    renderRaceBoards();
    animateRace(results);
    setStatus("Race running. Watch the boards!", "success");
  } catch (e) {
    setStatus("Race failed. Check server connection.", "error");
  }
  state.isSolving = false;
}

function renderRaceBoards() {
  if (!raceContainer) return;
  const boards = raceContainer.querySelectorAll(".race-board");
  const gridSize = state.cols;
  const cellSize = Math.max(4, Math.min(10, Math.floor(160 / gridSize)));
  state.raceCells = {};

  boards.forEach((board) => {
    const algo = board.closest(".race-grid")?.dataset.algo;
    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
    board.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;
    const cells = [];
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = document.createElement("div");
        cell.className = "race-cell";
        if (state.maze[r][c] === 1) cell.classList.add("wall");
        if (r === state.start[0] && c === state.start[1])
          cell.classList.add("start");
        if (r === state.goal[0] && c === state.goal[1])
          cell.classList.add("goal");
        board.appendChild(cell);
        cells.push(cell);
      }
    }
    if (algo) state.raceCells[algo] = cells;
  });
}

function animateRace(results) {
  const delay = Math.max(4, getAnimDelay() - 2);
  ["bfs", "dfs", "ids", "astar"].forEach((algo) => {
    const result = results[algo];
    if (!result) return;
    const cells = state.raceCells?.[algo];
    if (!cells) return;
    const explored = result.explored || [];
    const path = result.path || [];
    explored.forEach((pos, idx) => {
      const timer = setTimeout(() => {
        const [r, c] = pos;
        const cell = cells[r * state.cols + c];
        if (
          cell &&
          !cell.classList.contains("start") &&
          !cell.classList.contains("goal")
        ) {
          cell.classList.add("explored");
        }
      }, idx * delay);
      state.raceTimers.push(timer);
    });
    const offset = explored.length * delay;
    path.forEach((pos, idx) => {
      const timer = setTimeout(
        () => {
          const [r, c] = pos;
          const cell = cells[r * state.cols + c];
          if (
            cell &&
            !cell.classList.contains("start") &&
            !cell.classList.contains("goal")
          ) {
            cell.classList.add("path");
          }
        },
        offset + idx * delay * 2,
      );
      state.raceTimers.push(timer);
    });
  });
}

function stopRace() {
  state.raceTimers.forEach((t) => clearTimeout(t));
  state.raceTimers = [];
}

function setGameMode(enabled, silent = false) {
  state.gameMode = enabled;
  state.player.active = enabled;
  if (gameToggle) gameToggle.checked = enabled;
  if (!silent) localStorage.setItem("mazeGame", enabled ? "on" : "off");
  if (enabled) {
    state.player.pos = [...state.start];
    state.player.steps = 0;
    updatePlayerStat();
    renderMaze();
    setStatus("Game mode: reach the goal using arrow keys or WASD.", "");
  } else {
    state.player.pos = null;
    state.player.steps = 0;
    updatePlayerStat();
    renderMaze();
  }
  if (!silent) playSound("action");
}

function movePlayer(dr, dc) {
  if (!state.gameMode || !state.player.pos) return;
  const [r, c] = state.player.pos;
  const nr = r + dr;
  const nc = c + dc;
  if (nr < 0 || nc < 0 || nr >= state.rows || nc >= state.cols) return;
  if (state.maze[nr][nc] === 1) return;
  state.player.pos = [nr, nc];
  state.player.steps += 1;
  updatePlayerStat();
  renderMaze();
  if (nr === state.goal[0] && nc === state.goal[1]) {
    finishGame();
  }
}

async function finishGame() {
  setStatus(
    `Goal reached in ${state.player.steps} steps. Comparing with AI...`,
    "success",
  );
  const result = await requestSolve("astar");
  state.lastResult = result;
  updateStats(result);
  setStatus(
    `You: ${state.player.steps} steps. AI (A*): ${result.cost} cost.`,
    "success",
  );
}

function updatePlayerStat() {
  const el = $("#stat-player-value");
  if (!el) return;
  if (state.gameMode) {
    el.textContent = state.player.steps.toLocaleString();
  } else {
    el.textContent = "—";
  }
}

function applyResultStatic(result) {
  resetVisualization();
  const explored = result.explored || [];
  const path = new Set((result.path || []).map((p) => p.join(",")));
  explored.forEach(([r, c]) => {
    const cell = getCell(r, c);
    if (!cell) return;
    if (path.has(`${r},${c}`)) return;
    if (r === state.start[0] && c === state.start[1]) return;
    if (r === state.goal[0] && c === state.goal[1]) return;
    cell.className = "cell cell-explored";
  });
  (result.path || []).forEach(([r, c]) => {
    const cell = getCell(r, c);
    if (!cell) return;
    if (r === state.start[0] && c === state.start[1]) return;
    if (r === state.goal[0] && c === state.goal[1]) return;
    cell.className = "cell cell-path";
  });
  if (state.heatmapEnabled) applyHeatmap(result);
}

function applyHeatmap(result) {
  clearHeatmap();
  const explored = result.explored || [];
  const path = new Set((result.path || []).map((p) => p.join(",")));
  const max = Math.max(explored.length - 1, 1);

  explored.forEach(([r, c], idx) => {
    if (path.has(`${r},${c}`)) return;
    const cell = getCell(r, c);
    if (!cell) return;
    if (r === state.start[0] && c === state.start[1]) return;
    if (r === state.goal[0] && c === state.goal[1]) return;
    const t = idx / max;
    const hue = 260 - 220 * t;
    const light = 30 + 35 * t;
    cell.classList.add("cell-heatmap");
    cell.style.backgroundColor = `hsl(${hue}, 80%, ${light}%)`;
    cell.style.boxShadow = `0 0 6px hsla(${hue}, 80%, ${light}%, 0.35)`;
  });
}

function clearHeatmap() {
  $$(".cell-heatmap").forEach((cell) => {
    cell.classList.remove("cell-heatmap");
    cell.style.backgroundColor = "";
    cell.style.boxShadow = "";
  });
}

function buildDebugEvents(result) {
  const events = [];
  (result.explored || []).forEach((pos) => {
    events.push({ type: "explored", pos });
  });
  (result.path || []).forEach((pos) => {
    events.push({ type: "path", pos });
  });
  return events;
}

function startDebuggerFromUI() {
  if (!state.lastResult || !state.lastResult.algorithm) {
    solveMaze();
    return;
  }
  startDebugger(state.lastResult);
}

function startDebugger(result) {
  state.debug.events = buildDebugEvents(result);
  state.debug.index = 0;
  state.debug.running = false;
  resetVisualization();
  if (debugBar) debugBar.classList.add("active");
  if (debugToggle) {
    debugToggle.checked = true;
    state.debugMode = true;
    localStorage.setItem("mazeDebug", "on");
  }
}

function stopDebugger() {
  if (state.debug.timer) clearTimeout(state.debug.timer);
  state.debug.running = false;
}

function debugStepForward() {
  if (state.debug.index >= state.debug.events.length) return;
  const event = state.debug.events[state.debug.index];
  applyDebugEvent(event);
  state.debug.index += 1;
}

function debugStepBack() {
  if (state.debug.index <= 0) return;
  state.debug.index -= 1;
  resetVisualization();
  for (let i = 0; i < state.debug.index; i++) {
    applyDebugEvent(state.debug.events[i]);
  }
}

function debugPlay() {
  if (state.debug.running) return;
  state.debug.running = true;
  const step = () => {
    if (!state.debug.running) return;
    if (state.debug.index >= state.debug.events.length) {
      state.debug.running = false;
      return;
    }
    debugStepForward();
    state.debug.timer = setTimeout(step, getAnimDelay());
  };
  step();
}

function debugPause() {
  state.debug.running = false;
  if (state.debug.timer) clearTimeout(state.debug.timer);
}

function debugToEnd() {
  resetVisualization();
  state.debug.events.forEach((event) => applyDebugEvent(event));
  state.debug.index = state.debug.events.length;
  state.debug.running = false;
}

function applyDebugEvent(event) {
  const [r, c] = event.pos;
  const cell = getCell(r, c);
  if (!cell) return;
  if (r === state.start[0] && c === state.start[1]) return;
  if (r === state.goal[0] && c === state.goal[1]) return;
  if (event.type === "explored") {
    cell.className = "cell cell-explored";
  } else if (event.type === "path") {
    cell.className = "cell cell-path";
  }
}

async function requestSolve(algorithm) {
  const res = await fetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maze: state.maze,
      start: state.start,
      goal: state.goal,
      algorithm,
      weights: state.weights,
    }),
  });
  return res.json();
}

function exportMazePng() {
  const cellSize = 18;
  const canvas = document.createElement("canvas");
  canvas.width = state.cols * cellSize;
  canvas.height = state.rows * cellSize;
  const ctx = canvas.getContext("2d");
  const styles = getComputedStyle(document.body);
  const open = styles.getPropertyValue("--cell-open").trim() || "#12122a";
  const wall = styles.getPropertyValue("--cell-wall").trim() || "#1e1e3a";
  const start = styles.getPropertyValue("--cell-start").trim() || "#10b981";
  const goal = styles.getPropertyValue("--cell-goal").trim() || "#ef4444";

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      let color = open;
      if (state.maze[r][c] === 1) color = wall;
      const weight = state.weights?.[r]?.[c] || 1;
      if (weight > 1 && state.maze[r][c] === 0) {
        color = `rgba(249, 115, 22, ${Math.min(0.2 + weight * 0.05, 0.6)})`;
      }
      if (r === state.start[0] && c === state.start[1]) color = start;
      if (r === state.goal[0] && c === state.goal[1]) color = goal;
      ctx.fillStyle = color;
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }

  const link = document.createElement("a");
  link.download = "maze.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function shareLink() {
  const payload = {
    maze: state.maze,
    weights: state.weights,
    start: state.start,
    goal: state.goal,
    rows: state.rows,
    cols: state.cols,
  };
  const encoded = btoa(JSON.stringify(payload));
  const url = `${window.location.origin}${window.location.pathname}#m=${encoded}`;
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Share link copied to clipboard.", "success");
  } catch (e) {
    setStatus("Share link generated. Copy from address bar.", "success");
  }
  window.location.hash = `m=${encoded}`;
}

function loadFromHash() {
  const hash = window.location.hash;
  if (!hash.startsWith("#m=")) return false;
  try {
    const encoded = hash.slice(3);
    const data = JSON.parse(atob(encoded));
    if (!data || !data.maze) return false;
    state.maze = data.maze;
    if (
      data.weights &&
      data.weights.length === data.rows &&
      data.weights[0]?.length === data.cols
    ) {
      state.weights = data.weights;
    } else {
      state.weights = createWeightGrid(data.rows, data.cols, 1);
    }
    state.start = data.start || [1, 1];
    state.goal = data.goal || [data.rows - 2, data.cols - 2];
    state.rows = data.rows;
    state.cols = data.cols;
    state.lastResult = null;
    state.compareResults = null;
    sizeSlider.value = data.rows;
    sizeLabel.textContent = `${data.rows}×${data.cols}`;
    renderMaze();
    clearStats();
    setStatus("Loaded maze from shared link.", "success");
    return true;
  } catch (e) {
    return false;
  }
}

// ===== Helpers =====
function algoDisplayName(algo) {
  const names = {
    bfs: "BFS (Breadth-First)",
    dfs: "DFS (Depth-First)",
    ids: "IDS (Iterative Deepening)",
    astar: "A* Search",
  };
  return names[algo] || algo;
}

function setStatus(text, type) {
  statusBar.className = "glass-panel";
  if (type) statusBar.classList.add(type);
  const instant = type === "solving" || text.length > 120;
  typeStatus(text, instant);
}

function typeStatus(text, instant) {
  state.typingToken += 1;
  const token = state.typingToken;
  clearTimeout(state.typingTimer);

  if (instant) {
    statusText.textContent = text;
    statusBar.classList.remove("typing");
    return;
  }

  statusText.textContent = "";
  statusBar.classList.add("typing");
  let i = 0;
  const step = () => {
    if (token !== state.typingToken) return;
    statusText.textContent = text.slice(0, i + 1);
    i += 1;
    if (i < text.length) {
      state.typingTimer = setTimeout(step, 14);
    } else {
      statusBar.classList.remove("typing");
    }
  };
  step();
}

function selectAlgorithm(algo) {
  const btn = document.querySelector(`.algo-btn[data-algo="${algo}"]`);
  if (!btn) return;
  $$(".algo-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.selectedAlgo = algo;
  setStatus(`${algoDisplayName(algo)} selected.`, "");
  playSound("action");
}

function animateNumber(el, value, decimals) {
  if (!el || typeof value !== "number") return;
  const from = parseFloat(el.dataset.value || "0") || 0;
  const to = value;
  const duration = 600;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    el.textContent =
      decimals === 0
        ? Math.round(current).toLocaleString()
        : current.toFixed(decimals);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.dataset.value = String(to);
    }
  };
  requestAnimationFrame(tick);
}

function ensureAudioContext() {
  if (!state.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    state.audioCtx = new AudioCtx();
  }
  if (state.audioCtx.state === "suspended") {
    state.audioCtx.resume();
  }
  return state.audioCtx;
}

function playTone(freq, duration, type, gain) {
  if (!state.soundEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  amp.gain.value = gain || 0.05;
  amp.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration / 1000,
  );
  osc.connect(amp).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration / 1000);
}

function playSound(name) {
  if (!state.soundEnabled) return;
  switch (name) {
    case "solve-start":
      playTone(420, 90, "triangle", 0.05);
      break;
    case "solve-success":
      playTone(540, 120, "sine", 0.06);
      playTone(680, 140, "sine", 0.04);
      break;
    case "solve-fail":
      playTone(220, 160, "square", 0.05);
      break;
    case "toggle":
      playTone(520, 80, "sine", 0.04);
      break;
    case "error":
      playTone(180, 140, "sawtooth", 0.05);
      break;
    default:
      playTone(360, 70, "triangle", 0.04);
      break;
  }
}

function initParticles() {
  if (!particleCanvas) return;
  const ctx = particleCanvas.getContext("2d");
  const particles = [];
  const density = 12000;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    particleCanvas.width = window.innerWidth * dpr;
    particleCanvas.height = window.innerHeight * dpr;
    particleCanvas.style.width = `${window.innerWidth}px`;
    particleCanvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(
      140,
      Math.max(
        60,
        Math.floor((window.innerWidth * window.innerHeight) / density),
      ),
    );
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.8,
      });
    }
  };

  const getColors = () => {
    const styles = getComputedStyle(document.body);
    const c1 = styles.getPropertyValue("--accent-cyan").trim() || "#00d4ff";
    const c2 = styles.getPropertyValue("--accent-purple").trim() || "#8b5cf6";
    return { c1, c2 };
  };

  const draw = () => {
    const { c1, c2 } = getColors();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = c1;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = c1;
      ctx.globalAlpha = 0.65;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.strokeStyle = c2;
          ctx.globalAlpha = (1 - dist / 120) * 0.35;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    state.particle = requestAnimationFrame(draw);
  };

  resize();
  updateParticleColors();
  draw();
  window.addEventListener("resize", resize);
}

function updateParticleColors() {
  if (!particleCanvas) return;
  particleCanvas.style.opacity = state.theme === "light" ? "0.4" : "0.55";
}
