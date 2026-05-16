# AI Maze Solver - Search Algorithm Visualizer

This project is an interactive web application that visualizes various search algorithms solving a maze. It provides a platform to understand, compare, and experiment with fundamental AI search strategies in a hands-on manner.

## Features

- **Interactive Maze Grid**: Draw your own mazes, set start and goal points, or generate random mazes.
- **Multiple Search Algorithms**:
  - Breadth-First Search (BFS)
  - Depth-First Search (DFS)
  - Iterative Deepening Search (IDS)
  - A\* Search (using Manhattan distance heuristic)
- **Real-time Visualization**: Watch the algorithms explore the maze and find the path in real-time.
- **Algorithm Comparison**: Run all algorithms on the same maze and compare their performance based on nodes explored, path cost, and execution time.
- **Customization**:
  - Adjust the grid size.
  - Control the animation speed.
  - Draw walls, start/goal points, and weighted cells (for A\*).
- **Statistics & Charts**: View detailed statistics for each run and compare algorithms with bar and radar charts.
- **Maze Presets**: Quickly load different maze patterns like spirals or labyrinths.
- **Modern UI**: A sleek, modern interface with light/dark modes and sound effects.

## Tech Stack

- **Backend**: **Python** with the **Flask** framework.
- **Frontend**: **HTML5**, **CSS3**, and vanilla **JavaScript (ES6+)**.
- **Algorithms**: Implemented from scratch in Python.

## Project Structure

```
.
├── algorithms.py         # Core search algorithm implementations
├── app.py                # Flask backend server and API endpoints
├── requirements.txt      # Python dependencies
├── static/
│   ├── css/style.css     # Main stylesheet
│   └── js/main.js        # Frontend logic and visualization
└── templates/
    └── index.html        # Main HTML page
```

## Setup and Installation

To run this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/iafaaqanwar/AI-MAZE-SOLVER-SEARCH-ALGORITHM-VISUALIZER.git
    cd AI-MAZE-SOLVER-SEARCH-ALGORITHM-VISUALIZER
    ```

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    The only dependency is Flask, listed in `requirements.txt`.

    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask application:**

    ```bash
    python app.py
    ```

5.  **Open in your browser:**
    Navigate to `http://localhost:5000`.

## How to Use

1.  **Generate a Maze**: Click the "Generate Maze" button to create a random maze, or use the drawing tools on the left to create your own.
2.  **Select an Algorithm**: Choose a search algorithm (BFS, DFS, IDS, or A\*) from the control panel.
3.  **Solve**: Click the "Solve" button to start the visualization.
4.  **Compare**: Click "Compare All" to run all algorithms and see a detailed comparison in the right-hand panel.
5.  **Customize**: Use the sliders to adjust the maze size and animation speed. Use the "Draw Mode" panel to edit the maze structure.

## Code Overview

### `app.py`

This file contains the Flask web server. It defines three main API endpoints:

- `/api/generate`: Generates a new random maze.
- `/api/solve`: Takes a maze, start/goal points, and an algorithm, and returns the solution path and explored nodes.
- `/api/compare`: Runs all implemented algorithms on the same maze and returns a combined result for comparison.

### `algorithms.py`

This is the core of the project, containing the logic for the AI algorithms.

- **`generate_maze()`**: Implements a recursive backtracking algorithm to create a perfect maze (a maze with exactly one path between any two points).
- **`MazeSolver` class**:
  - `__init__()`: Initializes with the maze, start, and goal.
  - `bfs()`: Implements Breadth-First Search using a queue.
  - `dfs()`: Implements Depth-First Search using a stack.
  - `ids()`: Implements Iterative Deepening Search, which combines the benefits of BFS and DFS.
  - `astar()`: Implements A\* Search using a priority queue and the Manhattan distance heuristic. It also supports weighted cells.

### `static/js/main.js`

This file handles all the frontend logic:

- **State Management**: Manages the application state (maze grid, algorithm selection, etc.).
- **DOM Manipulation**: Renders the maze, updates stats, and handles user interactions.
- **API Calls**: Communicates with the Flask backend to generate and solve mazes.
- **Animation**: Contains the logic to animate the visualization of the explored nodes and the final path.
- **Charts**: Renders the comparison charts using HTML/CSS and the Canvas API for the radar chart.

### `templates/index.html` & `static/css/style.css`

These files define the structure and appearance of the web application, creating the three-panel layout and styling all the interactive components.
