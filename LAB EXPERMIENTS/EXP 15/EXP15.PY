import math

def entropy(data):
    counts = {}
    for row in data:
        label = row[-1]
        counts[label] = counts.get(label, 0) + 1
    ent = 0.0
    for count in counts.values():
        p = count / len(data)
        ent -= p * math.log2(p)
    return ent

def build_tree(data, features):
    labels = [row[-1] for row in data]
    if labels.count(labels[0]) == len(labels):
        return labels[0]
    if not features:
        return max(set(labels), key=labels.count)
    base_ent = entropy(data)
    best_gain, best_col = -1, None
    for col in features:
        vals = set(row[col] for row in data)
        new_ent = sum(
            (len([r for r in data if r[col] == v]) / len(data)) * entropy([r for r in data if r[col] == v])
            for v in vals
        )
        if base_ent - new_ent > best_gain:
            best_gain = base_ent - new_ent
            best_col = col
    tree = {best_col: {}}
    for val in set(row[best_col] for row in data):
        subset = [r for r in data if r[best_col] == val]
        tree[best_col][val] = build_tree(subset, [f for f in features if f != best_col])
    return tree

data = [
    ["Sunny", "Hot", "No"],
    ["Sunny", "Mild", "No"],
    ["Overcast", "Hot", "Yes"],
    ["Rainy", "Mild", "Yes"],
    ["Rainy", "Cool", "Yes"],
    ["Overcast", "Cool", "Yes"]
]

tree = build_tree(data, [0, 1])
print("Constructed Decision Tree:", tree)
