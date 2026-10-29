import itertools

for p in itertools.permutations(range(10), 8):
    s, e, n, d, m, o, r, y = p
    if s == 0 or m == 0:
        continue
    send = s * 1000 + e * 100 + n * 10 + d
    more = m * 1000 + o * 100 + r * 10 + e
    money = m * 10000 + o * 1000 + n * 100 + e * 10 + y
    if send + more == money:
        print(
            f"Mapping: {{'D': {d}, 'E': {e}, 'M': {m}, 'N': {n}, 'O': {o}, 'R': {r}, 'S': {s}, 'Y': {y}}}"
        )
        print(f"{send} + {more} = {money}")
        break
