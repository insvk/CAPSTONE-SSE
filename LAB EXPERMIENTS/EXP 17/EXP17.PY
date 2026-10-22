def sum_to_n(n):
    if n <= 1:
        return 1
    return n + sum_to_n(n - 1)

n = 10
print(f"Sum of 1 to {n}:", sum_to_n(n))
