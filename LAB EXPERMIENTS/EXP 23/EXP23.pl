% EXP23.pl
% Experiment 3: Family tree

% parent(Parent, Child).
parent(john, mary).
parent(john, david).
parent(susan, mary).
parent(robert, david).
parent(mary, alice).
parent(mary, bob).
parent(david, charlie).

male(john).
male(david).
male(bob).
male(charlie).
male(robert).

female(mary).
female(susan).
female(alice).

father(X, Y) :-
    parent(X, Y),
    male(X).

mother(X, Y) :-
    parent(X, Y),
    female(X).

child(X, Y) :-
    parent(Y, X).

sibling(X, Y) :-
    parent(P, X),
    parent(P, Y),
    X \= Y.

grandparent(X, Y) :-
    parent(X, Z),
    parent(Z, Y).

grandchild(X, Y) :-
    grandparent(Y, X).

brother(X, Y) :-
    sibling(X, Y),
    male(X).

sister(X, Y) :-
    sibling(X, Y),
    female(X).

% Example queries:
% ?- father(john, mary).
% ?- child(X, mary).
% ?- sibling(mary, X).
% ?- grandchild(X, john).
% ?- mother(X, alice).
