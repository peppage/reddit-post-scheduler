# http://flask.pocoo.org/docs/0.12/
from flask import redirect, Flask, render_template, session, request, flash, url_for, g, jsonify, request, send_from_directory
import praw  # https://praw.readthedocs.io/en/latest/index.html
import uuid
from functools import wraps
from json_encoder import AlchemyEncoder
from models import Post
from base import Session, engine, Base
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import settings

# Todo
# Schedule non theme posts
# api endpoint for announcing the theme
# make fridays obvious
# show holidays
# search for dupes
# add who created the post to the db
# last edited the post (versioning?)
# smarter editor
# Should the post be in a popup and then have a close button?
# Go back to top after moving to next page

app = Flask(__name__)
app.secret_key = settings.secret_key
app.json_encoder = AlchemyEncoder
Base.metadata.create_all(engine)

sched = BackgroundScheduler()


@sched.scheduled_job('cron', id="do_post", hour=settings.hour, minute=settings.minute)
def postJob():
    now = datetime.now()
    date = datetime(now.year, now.month, now.day)
    s = Session()
    p = s.query(Post).filter(Post.date == date).one()
    s.close()
    sub = getRedditScriptCreds().subreddit(settings.subreddit)
    post(sub, p)
    updateDescription(sub, p.spoiler)


def updateDescription(subreddit, spoiler):
    splitDesctiption = subreddit.description.split("#####")
    newDescription = splitDesctiption[0] + "##### " + \
        settings.description_prefix + ' ' + spoiler
    subreddit.mod.update(description=newDescription)


def post(subreddit, post):
    text = post.text + "\n ***** \n Theme  posted by " + post.user
    subreddit.submit(post.title, text)


sched.start()


def login_required(function_to_protect):
    @wraps(function_to_protect)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
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
    reddit = getRedditWebCreds()
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

    reddit = getRedditWebCreds()
    reddit.auth.authorize(code)

    subReddits = reddit.user.moderator_subreddits()
    auth = False
    for s in subReddits:
        if s == settings.subreddit:
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
        post.spoiler = request.form['spoiler']
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
    spoiler = request.form['spoiler']
    p = Post(text, date, user, title, spoiler)
    s.add(p)
    s.commit()
    s.close()
    return jsonify()


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


def getRedditWebCreds():
    return praw.Reddit(client_id=settings.web_client_id,
                       client_secret=settings.web_client_secret,
                       redirect_uri=settings.web_redirect_uri,
                       user_agent=settings.web_user_agent)


def getRedditScriptCreds():
    return praw.Reddit(client_id=settings.script_client_id,
                       client_secret=settings.script_client_secret,
                       redirect_uri=settings.script_redirect_uri,
                       user_agent=settings.script_user_agent,
                       password=settings.script_password,
                       username=settings.script_username)
