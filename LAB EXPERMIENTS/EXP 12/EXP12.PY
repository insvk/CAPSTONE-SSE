
def print_board(board):
    print()
    for i, row in enumerate(board):
        print(" | ".join(row))
        if i < 2:
            print("--+---+--")
    print()

def check_win(board, player):
    # Check rows
    for row in board:
        if all(cell == player for cell in row):
            return True

    # Check columns
    for col in range(3):
        if all(board[row][col] == player for row in range(3)):
            return True

    # Check diagonals
    if all(board[i][i] == player for i in range(3)):
        return True

    if all(board[i][2 - i] == player for i in range(3)):
        return True

    return False

def play_game():
    board = [[" " for _ in range(3)] for _ in range(3)]
    player = "X"

    print("TIC-TAC-TOE")
    print("Enter row and column numbers from 1 to 3.")

    for turn in range(9):
        print_board(board)

        while True:
            try:
                row = int(input(f"Player {player}, enter row: ")) - 1
                col = int(input(f"Player {player}, enter column: ")) - 1

                if not (0 <= row < 3 and 0 <= col < 3):
                    print("Invalid position. Use numbers 1 to 3.")
                    continue

                if board[row][col] != " ":
                    print("That cell is occupied. Try again.")
                    continue

                break

            except ValueError:
                print("Please enter valid integers.")

        board[row][col] = player

        if check_win(board, player):
            print_board(board)
            print(f"Player {player} wins!")
            return

        player = "O" if player == "X" else "X"

    print_board(board)
    print("Match drawn!")

if __name__ == "__main__":
    play_game()
