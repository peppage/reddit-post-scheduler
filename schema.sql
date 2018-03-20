CREATE TABLE IF NOT EXISTS "posts"  (
    "id" INTEGER PRIMARY KEY,
    "text" TEXT NOT NULL,
    "date" date NOT NULL,
    "user" varchar(30) NOT NULL,
    "title" varchar(30) NOT NULL
)