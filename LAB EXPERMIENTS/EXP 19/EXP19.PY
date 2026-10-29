records = [
    {"student": "Alice", "teacher": "Prof. Smith", "sub_code": "CS101"},
    {"student": "Bob", "teacher": "Prof. Johnson", "sub_code": "CS102"},
    {"student": "Charlie", "teacher": "Prof. Smith", "sub_code": "CS101"},
    {"student": "David", "teacher": "Prof. Williams", "sub_code": "CS103"}
]

for r in records:
    print(f"Student: {r['student']} | Teacher: {r['teacher']} | Subject: {r['sub_code']}")
