from collections import deque

def is_valid(m, c):
    if m < 0 or m > 3 or c < 0 or c > 3:
        return False
    if (m > 0 and m < c) or (3 - m > 0 and 3 - m < 3 - c):
        return False
    return True

def solve():
    start = (3, 3, 1)
    goal = (0, 0, 0)
    queue = deque([[start]])
    visited = {start}
    moves = [(1, 0), (2, 0), (0, 1), (0, 2), (1, 1)]
    while queue:
        path = queue.popleft()
        m, c, b = path[-1]
        if (m, c, b) == goal:
            return path
        for dm, dc in moves:
            if b == 1:
                nm, nc, nb = m - dm, c - dc, 0
            else:
                nm, nc, nb = m + dm, c + dc, 1
            if is_valid(nm, nc) and (nm, nc, nb) not in visited:
                visited.add((nm, nc, nb))
                queue.append(path + [(nm, nc, nb)])
    return None

path = solve()
for m, c, b in path:
    side = "Left" if b == 1 else "Right"
    print(f"Missionaries: {m}, Cannibals: {c}, Boat: {side}")
