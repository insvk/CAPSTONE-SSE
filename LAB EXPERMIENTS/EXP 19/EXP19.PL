teaches(prof_smith, cs101).
teaches(prof_johnson, cs102).
teaches(prof_williams, cs103).

enrolled(alice, cs101).
enrolled(bob, cs102).
enrolled(charlie, cs101).
enrolled(david, cs103).

student_teacher(Student, Teacher, Subject) :-
    enrolled(Student, Subject),
    teaches(Teacher, Subject).
