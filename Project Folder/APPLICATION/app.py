"""
AI Maze Solver - Flask Web Application
Run this file to start the server: python app.py
Then open http://localhost:5000 in your browser.
"""

from flask import Flask, render_template, request, jsonify
from algorithms import MazeSolver, generate_maze

app = Flask(__name__)


@app.route('/')
def index():
    """Serve the main UI page."""
    return render_template('index.html')


@app.route('/api/solve', methods=['POST'])
def solve():
    """Solve the maze with a specific algorithm."""
    data = request.json
    maze = data['maze']
    start = data['start']
    goal = data['goal']
    algorithm = data['algorithm']
    weights = data.get('weights')

    solver = MazeSolver(maze, start, goal, weights)

    if algorithm == 'bfs':
        result = solver.bfs()
    elif algorithm == 'dfs':
        result = solver.dfs()
    elif algorithm == 'ids':
        result = solver.ids()
    elif algorithm == 'astar':
        result = solver.astar()
    else:
        return jsonify({'error': 'Unknown algorithm'}), 400

    result['algorithm'] = algorithm
    return jsonify(result)


@app.route('/api/compare', methods=['POST'])
def compare():
    """Run all algorithms on the same maze for comparison."""
    data = request.json
    maze = data['maze']
    start = data['start']
    goal = data['goal']
    weights = data.get('weights')

    solver = MazeSolver(maze, start, goal, weights)

    results = {
        'bfs': solver.bfs(),
        'dfs': solver.dfs(),
        'ids': solver.ids(),
        'astar': solver.astar()
    }

    # Add algorithm names to results
    for alg_name, result in results.items():
        result['algorithm'] = alg_name

    return jsonify(results)


@app.route('/api/generate', methods=['POST'])
def generate():
    """Generate a random maze."""
    data = request.json
    rows = data.get('rows', 21)
    cols = data.get('cols', 21)

    maze, start, goal, actual_rows, actual_cols = generate_maze(rows, cols)

    return jsonify({
        'maze': maze,
        'start': start,
        'goal': goal,
        'rows': actual_rows,
        'cols': actual_cols
    })


if __name__ == '__main__':
    print("=" * 50)
    print("  AI Maze Solver - Search Algorithm Visualizer")
    print("  Open http://localhost:5000 in your browser")
    print("=" * 50)
    app.run(debug=True, port=5000)
