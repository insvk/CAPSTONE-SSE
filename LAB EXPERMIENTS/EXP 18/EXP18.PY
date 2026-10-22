db = {
    "John": "1995-05-12",
    "Alice": "1998-11-23",
    "Bob": "2001-03-15",
    "Diana": "1992-07-30"
}

def get_dob(name):
    return db.get(name, "Not found")

print("Database:", db)
print("DOB of Alice:", get_dob("Alice"))
