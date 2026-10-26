% EXP21.pl
% Experiment 1: Towers of Hanoi

hanoi(1, Source, Destination, _) :-
    format('Move disk from ~w to ~w~n', [Source, Destination]).

hanoi(N, Source, Destination, Auxiliary) :-
    integer(N),
    N > 1,
    N1 is N - 1,
    hanoi(N1, Source, Auxiliary, Destination),
    hanoi(1, Source, Destination, Auxiliary),
    hanoi(N1, Auxiliary, Destination, Source).

% Query:
% ?- hanoi(3, a, c, b).
