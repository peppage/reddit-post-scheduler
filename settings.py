import ConfigParser  # https://docs.python.org/2/library/configparser.html


_config = ConfigParser.RawConfigParser()

_config.read('scheduler.cfg')
web_client_id = _config.get('RedditWebApi', 'client_id')
web_client_secret = _config.get('RedditWebApi', 'client_secret')
web_redirect_uri = _config.get('RedditWebApi', 'redirect_uri')
web_user_agent = _config.get('RedditWebApi', 'user_agent')

script_client_id = _config.get('RedditScriptApi', 'client_id')
script_client_secret = _config.get('RedditScriptApi', 'client_secret')
script_redirect_uri = _config.get('RedditScriptApi', 'redirect_uri')
script_user_agent = _config.get('RedditScriptApi', 'user_agent')
script_password = _config.get('RedditScriptApi', 'password')
script_username = _config.get('RedditScriptApi', 'username')

subreddit = _config.get('App', 'subreddit')
secret_key = _config.get('App', 'secret_key')
description_prefix = _config.get('App', 'description_prefix')
hour = _config.get('App', 'hour')
minute = _config.get('App', 'minute')
