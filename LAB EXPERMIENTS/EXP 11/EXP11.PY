def is_safe(node, color, assignment, graph):
    for neighbor in graph.get(node, []):
        if assignment.get(neighbor) == color:
            return False
    return True

def solve_csp(nodes, colors, assignment, graph):
    if len(assignment) == len(nodes):
        return assignment
    unassigned = [n for n in nodes if n not in assignment][0]
    for color in colors:
        if is_safe(unassigned, color, assignment, graph):
            assignment[unassigned] = color
            result = solve_csp(nodes, colors, assignment, graph)
            if result:
                return result
            del assignment[unassigned]
    return None

states = ["WA", "NT", "SA", "Q", "NSW", "V", "T"]
colors = ["Red", "Green", "Blue"]
graph = {
    "WA": ["NT", "SA"],
    "NT": ["WA", "SA", "Q"],
    "SA": ["WA", "NT", "Q", "NSW", "V"],
    "Q": ["NT", "SA", "NSW"],
    "NSW": ["Q", "SA", "V"],
    "V": ["SA", "NSW"],
    "T": []
}

solution = solve_csp(states, colors, {}, graph)
for state, color in solution.items():
    print(f"{state}: {color}")
