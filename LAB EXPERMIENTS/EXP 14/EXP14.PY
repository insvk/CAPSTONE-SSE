import math

def alpha_beta(depth, node_index, is_max, scores, height, alpha, beta):
    if depth == height:
        return scores[node_index]
    if is_max:
        max_eval = -math.inf
        for i in range(2):
            val = alpha_beta(depth + 1, node_index * 2 + i, False, scores, height, alpha, beta)
            max_eval = max(max_eval, val)
            alpha = max(alpha, val)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = math.inf
        for i in range(2):
            val = alpha_beta(depth + 1, node_index * 2 + i, True, scores, height, alpha, beta)
            min_eval = min(min_eval, val)
            beta = min(beta, val)
            if beta <= alpha:
                break
        return min_eval

scores = [3, 5, 6, 9, 1, 2, 0, -1]
height = int(math.log2(len(scores)))
result = alpha_beta(0, 0, True, scores, height, -math.inf, math.inf)
print("Optimal Value with Alpha-Beta Pruning:", result)
