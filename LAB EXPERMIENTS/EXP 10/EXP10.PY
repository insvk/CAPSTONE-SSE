
import heapq

def a_star(graph, heuristic, start, goal):
    # Priority queue stores: (f_cost, g_cost, node, path)
    pq = [(heuristic[start], 0, start, [start])]
    best_g = {start: 0}

    while pq:
        f, g, current, path = heapq.heappop(pq)

        # Ignore outdated entries
        if g != best_g.get(current):
            continue

        if current == goal:
            return path, g

        for neighbor, cost in graph.get(current, []):
            new_g = g + cost

            if new_g < best_g.get(neighbor, float("inf")):
                best_g[neighbor] = new_g
                new_f = new_g + heuristic[neighbor]

                heapq.heappush(
                    pq,
                    (new_f, new_g, neighbor, path + [neighbor])
                )

    return None, float("inf")


graph = {
    "A": [("B", 1), ("C", 4)],
    "B": [("D", 5), ("E", 12)],
    "C": [("E", 2)],
    "D": [("E", 3)],
    "E": []
}

# Actual shortest remaining costs for this example
heuristic = {
    "A": 6,
    "B": 8,
    "C": 2,
    "D": 3,
    "E": 0
}

path, cost = a_star(graph, heuristic, "A", "E")

if path:
    print("Optimal Path:", " -> ".join(path))
    print("Minimum Cost:", cost)
else:
    print("No path found.")
