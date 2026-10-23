from collections import deque

def water_jug_problem(capacity_4, capacity_3, target):
    queue = deque([((0, 0), ["(0, 0) <- Start"])])
    visited = set([(0, 0)])
    
    while queue:
        (x, y), path = queue.popleft()
        
        if x == target:
            return path
            
        successors = [
            ((capacity_4, y), "Fill 4L jug"),
            ((x, capacity_3), "Fill 3L jug"),
            ((0, y), "Empty 4L jug"),
            ((x, 0), "Empty 3L jug"),
            ((x - min(x, capacity_3 - y), y + min(x, capacity_3 - y)), "Pour 4L jug into 3L jug"),
            ((x + min(y, capacity_4 - x), y - min(y, capacity_4 - x)), "Pour 3L jug into 4L jug")
        ]
        
        for next_state, action in successors:
            if next_state not in visited:
                visited.add(next_state)
                new_path = path + [f"({next_state[0]}, {next_state[1]}) <- {action}"]
                queue.append((next_state, new_path))
                
    return None

solution = water_jug_problem(4, 3, 2)

if solution:
    print("Output preview:")
    for step in solution:
        print(step)
else:
    print("No solution found.")
