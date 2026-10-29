% EXP25.pl
% Experiment 5: Monkey and Banana problem

% State: state(MonkeyPosition, MonkeyStatus, BoxPosition, BananaStatus)
% MonkeyStatus = on_floor | on_box
% BananaStatus = has | has_not

% Walk from one position to another.
move(
    state(P, on_floor, B, has_not),
    walk(P, B),
    state(B, on_floor, B, has_not)
) :-
    P \= B.

% Push the box from its current position to another position.
move(
    state(B, on_floor, B, has_not),
    push(B, T),
    state(T, on_floor, T, has_not)
) :-
    B \= T.

% Climb onto the box.
move(
    state(B, on_floor, B, has_not),
    climb,
    state(B, on_box, B, has_not)
).

% Grasp the bananas when standing on the box.
move(
    state(B, on_box, B, has_not),
    grasp,
    state(B, on_box, B, has)
).

goal(state(_, _, _, has)).

solve(State, []) :-
    goal(State).

solve(State, [Action | Rest]) :-
    move(State, Action, NextState),
    solve(NextState, Rest).

start :-
    Initial = state(door, on_floor, window, has_not),
    solve(Initial, Actions),
    write('Solution steps:'), nl,
    print_actions(Actions).

print_actions([]).
print_actions([Action | Rest]) :-
    writeln(Action),
    print_actions(Rest).

% Query:
% ?- start.
