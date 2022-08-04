# -*- coding: utf-8 -*-
import os

# env
_is_dev = os.environ.get("IS_DEV") == "true"
_h_captcha_sitekey = os.environ.get("GUWEB_H_CAPTCHA_SITEKEY")
_h_captcha_secret = os.environ.get("GUWEB_H_CAPTCHA_SECRET")

_db_host = os.environ.get("GUWEB_DB_HOST")
_db_user = os.environ.get("GUWEB_DB_USER")
_db_password = os.environ.get("GUWEB_DB_PASSWORD")
_db_database = os.environ.get("GUWEB_DB_DATABASE")

_app_name = os.environ.get("GUWEB_APP_NAME")
_secret_key = os.environ.get("GUWEB_SECRET_KEY")
_domain = os.environ.get("GUWEB_DOMAIN")
_path_to_bancho_py = os.environ.get("GUWEB_PATH_TO_BANCHO_PY")
_discord_invite_id = os.environ.get("DISCORD_INVITE_ID")

_registration_allowed = os.environ.get("GUWEB_REGISTRATION_ALLOWED")
# end env

# app name
app_name = _app_name if _app_name is not None else 'guweb'

# secret key
secret_key = _secret_key if _secret_key is not None else 'changeme'

#hCaptcha settings:
hCaptcha_sitekey = _h_captcha_sitekey if _h_captcha_sitekey is not None else 'changeme'
hCaptcha_secret = _h_captcha_secret if _h_captcha_secret is not None else 'changeme'

# domain (used for api, avatar, etc)
# *.dev.ppy.sb are resolved as 127.0.0.1, you can keep it as it is when developing.
domain = _domain if _domain is not None else 'dev.ppy.sb'

# mysql credentials
mysql = {
    'db': _db_database if _db_database is not None else 'banchopy',
    'host': _db_host if _db_host is not None else 'mysql',
    'user': _db_user if _db_user is not None else 'root',
    'password': _db_password if _db_password is not None else '',
}

# path to gulag root (must have leading and following slash)
path_to_gulag = _path_to_bancho_py if _path_to_bancho_py is not None else os.path.join(os.getcwd(), '../bancho.py') + '/'

# enable debug (disable when in production to improve performance)
debug = _is_dev

# disallowed names (hardcoded banned usernames)
disallowed_names = {
    'cookiezi', 'rrtyui',
    'hvick225', 'qsc20010'
}

# disallowed passwords (hardcoded banned passwords)
disallowed_passwords = {
    'password', 'minilamp'
}

# enable registration
registration = _registration_allowed if _registration_allowed is not None else True

# social links (used throughout guweb)
github = 'https://github.com/ppy-sb/guweb'
discord_invite_id = _discord_invite_id
discord_server = 'https://discord.com/invite/' + discord_invite_id if discord_invite_id is not None else None
youtube = 'https://youtube.com/'
twitter = 'https://twitter.com/'
instagram = 'https://instagram.com/'
