% EXP24.pl
% Experiment 4: Diet suggestions based on disease
% Educational example only; not medical advice.

diet(diabetes, whole_grains).
diet(diabetes, green_vegetables).
diet(diabetes, low_sugar_foods).
diet(diabetes, legumes).

diet(hypertension, fruits).
diet(hypertension, green_vegetables).
diet(hypertension, low_sodium_foods).
diet(hypertension, whole_grains).

diet(anemia, iron_rich_foods).
diet(anemia, vitamin_c_rich_fruits).
diet(anemia, legumes).
diet(anemia, leafy_vegetables).

diet(obesity, vegetables).
diet(obesity, fruits).
diet(obesity, lean_protein).
diet(obesity, whole_grains).

suggest_diet(Disease, Food) :-
    diet(Disease, Food).

show_diet(Disease) :-
    diet(Disease, Food),
    format('Suggested food: ~w~n', [Food]),
    fail.
show_diet(_).

% Example queries:
% ?- suggest_diet(diabetes, Food).
% ?- show_diet(hypertension).
% ?- suggest_diet(anemia, iron_rich_foods).
