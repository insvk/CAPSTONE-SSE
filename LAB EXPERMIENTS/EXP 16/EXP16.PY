
import math
import random

random.seed(1)

def sigmoid(x):
    x = max(-60, min(60, x))
    return 1 / (1 + math.exp(-x))

# XOR training data
inputs = [[0, 0], [0, 1], [1, 0], [1, 1]]
targets = [0, 1, 1, 0]

# Network: 2 input neurons, 2 hidden neurons, 1 output neuron
w1 = [[random.uniform(-1, 1) for _ in range(2)]
      for _ in range(2)]
b1 = [random.uniform(-1, 1) for _ in range(2)]

w2 = [random.uniform(-1, 1) for _ in range(2)]
b2 = random.uniform(-1, 1)

learning_rate = 0.7
epochs = 30000

for epoch in range(epochs):
    for x, target in zip(inputs, targets):

        # Forward propagation
        hidden = [
            sigmoid(sum(w1[j][i] * x[i] for i in range(2)) + b1[j])
            for j in range(2)
        ]

        output = sigmoid(
            sum(w2[j] * hidden[j] for j in range(2)) + b2
        )

        # Backpropagation
        output_delta = (
            (target - output) * output * (1 - output)
        )

        hidden_delta = [
            hidden[j] * (1 - hidden[j]) * w2[j] * output_delta
            for j in range(2)
        ]

        # Update output-layer weights
        for j in range(2):
            w2[j] += learning_rate * output_delta * hidden[j]

        b2 += learning_rate * output_delta

        # Update hidden-layer weights
        for j in range(2):
            for i in range(2):
                w1[j][i] += (
                    learning_rate * hidden_delta[j] * x[i]
                )
            b1[j] += learning_rate * hidden_delta[j]

# Test the trained network
print("Feedforward Neural Network - XOR Results")

for x in inputs:
    hidden = [
        sigmoid(sum(w1[j][i] * x[i] for i in range(2)) + b1[j])
        for j in range(2)
    ]

    output = sigmoid(
        sum(w2[j] * hidden[j] for j in range(2)) + b2
    )

    prediction = 1 if output >= 0.5 else 0

    print(
        f"Input: {x}, "
        f"Output: {output:.4f}, "
        f"Predicted: {prediction}"
    )
