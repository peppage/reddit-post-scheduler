from sqlalchemy import Column, Integer, String, DateTime
from base import Base


class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True)
    text = Column(String(250), nullable=False)
    date = Column(DateTime, nullable=False)
    user = Column(String(30), nullable=False)
    title = Column(String(30), nullable=False)
    spoiler = Column(String(30), nullable=False)

    def __init__(self, text, date, user, title, spoiler):
        self.text = text
        self.date = date
        self.user = user
        self.title = title
        self.spoiler = spoiler

    def __json__(self):
        return ['text', 'date', 'user', 'title', 'id', 'spoiler']
