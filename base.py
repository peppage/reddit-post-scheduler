
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlite3 import dbapi2 as sqlite
import ConfigParser

config = ConfigParser.RawConfigParser()
config.read('scheduler.cfg')
database = config.get('App', 'database')

engine = create_engine(database, module=sqlite)
Session = sessionmaker(bind=engine)

Base = declarative_base()
