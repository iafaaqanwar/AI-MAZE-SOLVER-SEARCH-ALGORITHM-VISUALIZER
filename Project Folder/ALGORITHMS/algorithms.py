"""
AI Search-Based Maze Solver
Implements BFS, DFS, IDS (Iterative Deepening Search), and A* Search algorithms.
Uses Queue (deque), Stack (list), and Priority Queue (heapq) as required.
"""

import time
import random
import sys
from collections import deque
import heapq

# Increase recursion limit for IDS on larger mazes
sys.setrecursionlimit(50000)


class MazeSolver:
    """
    Solves a maze using various search algorithms.
    Maze is a 2D grid: 0 = open cell, 1 = wall.
    """

    def __init__(self, maze, start, goal, weights=None):
        self.maze = maze
        self.start = tuple(start)
        self.goal = tuple(goal)
        self.rows = len(maze)
        self.cols = len(maze[0])
        self.weights = None
        if weights and len(weights) == self.rows and len(weights[0]) == self.cols:
            self.weights = weights

    def is_valid(self, pos):
        """Check if a position is within bounds and not a wall."""
        r, c = pos
        return 0 <= r < self.rows and 0 <= c < self.cols and self.maze[r][c] == 0

    def get_neighbors(self, pos):
        """Get valid neighboring cells (up, down, left, right)."""
        r, c = pos
        neighbors = []
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            new_pos = (r + dr, c + dc)
            if self.is_valid(new_pos):
                neighbors.append(new_pos)
        return neighbors

    def reconstruct_path(self, came_from, current):
        """Reconstruct path from start to current node using came_from map."""
        path = []
        while current is not None:
            path.append(current)
            current = came_from.get(current)
        return path[::-1]

    def _build_result(self, path, explored, start_time, found):
        """Build a standardized result dictionary."""
        elapsed = time.time() - start_time
        return {
            'path': [list(p) for p in path],
            'explored': [list(e) for e in explored],
            'cost': self._path_cost(path),
            'time': round(elapsed * 1000, 4),
            'nodes_explored': len(explored),
            'found': found
        }

    def _move_cost(self, pos):
        if not self.weights:
            return 1
        r, c = pos
        try:
            return max(1, int(self.weights[r][c]))
        except (TypeError, ValueError):
            return 1

    def _path_cost(self, path):
        if not path:
            return 0
        if not self.weights:
            return len(path) - 1
        cost = 0
        for i, (r, c) in enumerate(path):
            if i == 0:
                continue
            cost += self._move_cost((r, c))
        return cost

    # ========== BFS - Breadth First Search ==========
    # Uses: Queue (collections.deque)
    # Properties: Complete, Optimal (for unweighted graphs)

    def bfs(self):
        """
        Breadth-First Search using a FIFO Queue (deque).
        Explores nodes level by level, guarantees shortest path.
        """
        start_time = time.time()
        queue = deque([self.start])           # FIFO Queue
        came_from = {self.start: None}
        explored = []

        while queue:
            current = queue.popleft()         # Dequeue from front
            explored.append(current)

            if current == self.goal:
                path = self.reconstruct_path(came_from, current)
                return self._build_result(path, explored, start_time, True)

            for neighbor in self.get_neighbors(current):
                if neighbor not in came_from:
                    came_from[neighbor] = current
                    queue.append(neighbor)    # Enqueue at back

        return self._build_result([], explored, start_time, False)

    # ========== DFS - Depth First Search ==========
    # Uses: Stack (Python list)
    # Properties: Not optimal, may not find shortest path

    def dfs(self):
        """
        Depth-First Search using a LIFO Stack (list).
        Explores as deep as possible before backtracking.
        """
        start_time = time.time()
        stack = [self.start]                  # LIFO Stack
        came_from = {self.start: None}
        explored = []

        while stack:
            current = stack.pop()             # Pop from top (LIFO)
            explored.append(current)

            if current == self.goal:
                path = self.reconstruct_path(came_from, current)
                return self._build_result(path, explored, start_time, True)

            for neighbor in self.get_neighbors(current):
                if neighbor not in came_from:
                    came_from[neighbor] = current
                    stack.append(neighbor)     # Push to top

        return self._build_result([], explored, start_time, False)

    # ========== IDS - Iterative Deepening Search ==========
    # Uses: Stack (implicit via recursion) with increasing depth limits
    # Properties: Complete, Optimal (like BFS), Memory efficient (like DFS)

    def _dls_recursive(self, node, depth, limit, came_from, visited, explored):
        """Depth-Limited Search helper (recursive)."""
        explored.append(node)

        if node == self.goal:
            return self.reconstruct_path(came_from, node)

        if depth >= limit:
            return None

        for neighbor in self.get_neighbors(node):
            if neighbor not in visited:
                visited.add(neighbor)
                came_from[neighbor] = node
                result = self._dls_recursive(
                    neighbor, depth + 1, limit, came_from, visited, explored
                )
                if result is not None:
                    return result
        return None

    def ids(self, max_depth=None):
        """
        Iterative Deepening Search.
        Runs Depth-Limited Search with increasing depth limits.
        Combines BFS completeness with DFS memory efficiency.
        """
        if max_depth is None:
            max_depth = self.rows * self.cols
        start_time = time.time()
        all_explored = []

        for limit in range(max_depth):
            explored = []
            visited = {self.start}
            came_from = {self.start: None}
            path = self._dls_recursive(
                self.start, 0, limit, came_from, visited, explored
            )
            all_explored.extend(explored)
            if path is not None:
                return self._build_result(path, all_explored, start_time, True)

        return self._build_result([], all_explored, start_time, False)

    # ========== A* Search ==========
    # Uses: Priority Queue (heapq)
    # Heuristic: Manhattan Distance
    # Properties: Complete, Optimal (with admissible heuristic)

    def heuristic(self, pos):
        """Manhattan distance heuristic (admissible for grid movement)."""
        return abs(pos[0] - self.goal[0]) + abs(pos[1] - self.goal[1])

    def astar(self):
        """
        A* Search using a Priority Queue (heapq).
        f(n) = g(n) + h(n) where h is Manhattan distance.
        Guarantees optimal path with admissible heuristic.
        """
        start_time = time.time()
        counter = 0
        # Priority Queue: (f_score, counter, position)
        open_set = [(self.heuristic(self.start), counter, self.start)]
        came_from = {self.start: None}
        g_score = {self.start: 0}
        explored = []
        closed_set = set()

        while open_set:
            f, _, current = heapq.heappop(open_set)   # Dequeue min f

            if current in closed_set:
                continue
            closed_set.add(current)
            explored.append(current)

            if current == self.goal:
                path = self.reconstruct_path(came_from, current)
                return self._build_result(path, explored, start_time, True)

            for neighbor in self.get_neighbors(current):
                if neighbor in closed_set:
                    continue
                tentative_g = g_score[current] + self._move_cost(neighbor)

                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    g_score[neighbor] = tentative_g
                    f_score = tentative_g + self.heuristic(neighbor)
                    counter += 1
                    heapq.heappush(open_set, (f_score, counter, neighbor))
                    came_from[neighbor] = current

        return self._build_result([], explored, start_time, False)


# ========== Maze Generator ==========

def generate_maze(rows, cols):
    """
    Generate a maze using Recursive Backtracking algorithm.
    Creates a perfect maze with exactly one solution path.
    """
    # Ensure odd dimensions for proper wall/path structure
    if rows % 2 == 0:
        rows += 1
    if cols % 2 == 0:
        cols += 1

    # Initialize with all walls
    maze = [[1] * cols for _ in range(rows)]

    def carve(r, c):
        maze[r][c] = 0
        directions = [(0, 2), (2, 0), (0, -2), (-2, 0)]
        random.shuffle(directions)
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 < nr < rows and 0 < nc < cols and maze[nr][nc] == 1:
                maze[r + dr // 2][c + dc // 2] = 0  # Remove wall between
                carve(nr, nc)

    carve(1, 1)

    start = [1, 1]
    goal = [rows - 2, cols - 2]
    maze[start[0]][start[1]] = 0
    maze[goal[0]][goal[1]] = 0

    return maze, start, goal, rows, cols
