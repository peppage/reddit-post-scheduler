# http://flask.pocoo.org/docs/0.12/
from flask import redirect, Flask, render_template, session, request, flash, url_for, g, jsonify, request, send_from_directory
import ConfigParser  # https://docs.python.org/2/library/configparser.html
import praw  # https://praw.readthedocs.io/en/latest/index.html
import uuid
from functools import wraps
from json_encoder import AlchemyEncoder
from models import Post
from base import Session, engine, Base
from datetime import datetime


# Todo
# Schedule non theme posts
# api endpoint for announcing the theme
# make fridays obvious
# show holidays
# search for dupes
# add who created the post to the db
# last edited the post (versioning?)


config = ConfigParser.RawConfigParser()
config.read('scheduler.cfg')
client_id = config.get('Reddit', 'client_id')
client_secret = config.get('Reddit', 'client_secret')
redirect_uri = config.get('Reddit', 'redirect_uri')
user_agent = config.get('Reddit', 'user_agent')
subreddit = config.get('App', 'subreddit')

app = Flask(__name__)
app.secret_key = config.get('App', 'secret_key')
app.json_encoder = AlchemyEncoder
Base.metadata.create_all(engine)


def login_required(function_to_protect):
    @wraps(function_to_protect)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        print(user_id)
        if user_id:
            return function_to_protect(*args, **kwargs)
        else:
            flash("Please login again")
            return redirect(url_for('login'))
    return wrapper


@app.route('/')
@login_required
def index():
    return render_template("index.html")


@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/reddit')
def redditLogin():
    reddit = getReddit()
    state = str(uuid.uuid4())
    session['reddit_state'] = state
    url = reddit.auth.url(['identity', 'mysubreddits'], state, 'temporary')
    return redirect(url)


@app.route('/login/callback')
def redditCallback():
    code = request.args.get('code')
    state = request.args.get('state')

    if state != session['reddit_state']:
        flash("Failed to login with reddit", 'error')
        return redirect(url_for('login'))

    reddit = getReddit()
    reddit.auth.authorize(code)

    subReddits = reddit.user.moderator_subreddits()
    auth = False
    for s in subReddits:
        if s == subreddit:
            auth = True

    if auth:
        session['user_id'] = reddit.user.me().name
        return redirect(url_for('index'))

    flash("You are not a Mod of the correct subreddit")
    return redirect('/')


@app.route('/api/posts')
def Posts():
    s = Session()
    start = datetime.strptime(request.args.get('start'), '%Y-%m-%d')
    days = request.args.get('days')
    return jsonify(s.query(Post).filter(Post.date > start).limit(days).all())


@app.route('/api/post/<int:post_id>', methods=['GET', 'POST'])
def PostApi(post_id):
    if request.method == 'GET':
        s = Session()
        q = s.query(Post).filter(Post.id == post_id)
        s.close()
        return jsonify(q.one())
    elif request.method == 'POST':
        s = Session()
        post = s.query(Post).filter(Post.id == post_id).one()
        post.text = request.form['text']
        post.date = datetime.strptime(request.form['date'], '%Y-%m-%d')
        post.user = request.form['user']
        post.title = request.form['title']
        s.commit()
        s.close()
        return jsonify()


@app.route('/api/post', methods=['POST'])
def AddPost():
    s = Session()
    text = request.form['text']
    date = datetime.strptime(request.form['date'], '%Y-%m-%d')
    user = request.form['user']
    title = request.form['title']
    p = Post(text, date, user, title)
    s.add(p)
    s.commit()
    s.close()
    return jsonify()


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


def getReddit():
    return praw.Reddit(client_id=client_id,
                       client_secret=client_secret,
                       redirect_uri=redirect_uri,
                       user_agent=user_agent)
