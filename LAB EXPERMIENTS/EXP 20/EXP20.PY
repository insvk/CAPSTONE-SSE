planets = {
    "Mercury": {"type": "Terrestrial", "distance_au": 0.39, "moons": 0},
    "Venus": {"type": "Terrestrial", "distance_au": 0.72, "moons": 0},
    "Earth": {"type": "Terrestrial", "distance_au": 1.00, "moons": 1},
    "Mars": {"type": "Terrestrial", "distance_au": 1.52, "moons": 2},
    "Jupiter": {"type": "Gas Giant", "distance_au": 5.20, "moons": 79},
    "Saturn": {"type": "Gas Giant", "distance_au": 9.58, "moons": 82},
    "Uranus": {"type": "Ice Giant", "distance_au": 19.22, "moons": 27},
    "Neptune": {"type": "Ice Giant", "distance_au": 30.05, "moons": 14}
}

for name, info in planets.items():
    print(f"{name}: {info['type']}, {info['distance_au']} AU, {info['moons']} moons")
