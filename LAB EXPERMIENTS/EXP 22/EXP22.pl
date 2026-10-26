% EXP22.pl
% Experiment 2: Check whether a bird can fly

bird(sparrow).
bird(parrot).
bird(pigeon).
bird(ostrich).
bird(penguin).
bird(eagle).

can_fly(sparrow).
can_fly(parrot).
can_fly(pigeon).
can_fly(eagle).

bird_can_fly(Bird) :-
    bird(Bird),
    can_fly(Bird).

bird_cannot_fly(Bird) :-
    bird(Bird),
    \+ can_fly(Bird).

% Example queries:
% ?- bird_can_fly(sparrow).
% ?- bird_cannot_fly(penguin).
% ?- bird_can_fly(X).
