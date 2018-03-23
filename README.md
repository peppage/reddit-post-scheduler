# Config file

* The reddit section is for the reddit app, get that here: https://www.reddit.com/prefs/apps.
* The redirect uri is /login/callback and without changing anything will be http://localhost:5000/login/callback for developing.
* The Secret Key is for securing sessions and can be anything
* Subreddit is the name of the subreddit you want it to match on. In the config so it can be changed easily for testing

# Running

FLASK_APP=postscheduler.py flask run
