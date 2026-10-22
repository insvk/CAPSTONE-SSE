environment = {"A": "DIRTY", "B": "DIRTY"}
location = "A"
cost = 0

print("Initial State:", environment)
for _ in range(2):
    if environment[location] == "DIRTY":
        print(f"Location {location} is Dirty. Cleaning...")
        environment[location] = "CLEAN"
        cost += 1
    else:
        print(f"Location {location} is already Clean.")
    if location == "A":
        print("Moving to Location B...")
        location = "B"
        cost += 1
    else:
        print("Moving to Location A...")
        location = "A"
        cost += 1

print("Final State:", environment)
print("Total Cost:", cost)
