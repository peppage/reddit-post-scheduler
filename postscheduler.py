# http://flask.pocoo.org/docs/0.12/
from flask import redirect, Flask, render_template, session, request, flash, url_for
import ConfigParser  # https://docs.python.org/2/library/configparser.html
import praw  # https://praw.readthedocs.io/en/latest/index.html
import uuid
from functools import wraps

# Todo
# Schedule non theme posts

config = ConfigParser.RawConfigParser()
config.read('scheduler.cfg')
client_id = config.get('Reddit', 'client_id')
client_secret = config.get('Reddit', 'client_secret')
redirect_uri = config.get('Reddit', 'redirect_uri')
user_agent = config.get('Reddit', 'user_agent')
secret_key = config.get('App', 'secret_key')
subreddit = config.get('App', 'subreddit')

app = Flask(__name__)
app.secret_key = secret_key


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


@app.route("/")
@login_required
def index():
    return "index"


@app.route("/login")
def login():
    return render_template('login.html')


@app.route("/reddit")
def redditLogin():
    reddit = getReddit()
    state = str(uuid.uuid4())
    session['reddit_state'] = state
    url = reddit.auth.url(['identity', 'mysubreddits'], state, 'temporary')
    return redirect(url)


@app.route("/login/callback")
def redditCallback():
    code = request.args.get('code')
    state = request.args.get('state')

    if state != session['reddit_state']:
        flash('Failed to login with reddit', 'error')
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

    flash('You are not a Mod of the correct subreddit')
    return redirect('/')


def getReddit():
    return praw.Reddit(client_id=client_id,
                       client_secret=client_secret,
                       redirect_uri=redirect_uri,
                       user_agent=user_agent)
