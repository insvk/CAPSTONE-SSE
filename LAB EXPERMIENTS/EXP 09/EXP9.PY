from itertools import permutations

def tsp(matrix):
    n = len(matrix)
    cities = list(range(1, n))
    min_cost = float("inf")
    best_path = []
    for perm in permutations(cities):
        path = [0] + list(perm) + [0]
        cost = matrix[0][perm[0]]
        for i in range(len(perm) - 1):
            cost += matrix[perm[i]][perm[i + 1]]
        cost += matrix[perm[-1]][0]
        if cost < min_cost:
            min_cost = cost
            best_path = path
    return best_path, min_cost

dist_matrix = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0]
]

path, cost = tsp(dist_matrix)
print("Optimal Tour:", path)
print("Minimum Cost:", cost)
