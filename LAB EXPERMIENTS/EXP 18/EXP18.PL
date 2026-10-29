person(john, "1995-05-12").
person(alice, "1998-11-23").
person(bob, "2001-03-15").
person(diana, "1992-07-30").

get_dob(Name, DOB) :- person(Name, DOB).
