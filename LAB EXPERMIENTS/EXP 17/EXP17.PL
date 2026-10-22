sum_to_n(1, 1).
sum_to_n(N, Sum) :-
    N > 1,
    N1 is N - 1,
    sum_to_n(N1, SubSum),
    Sum is N + SubSum.
