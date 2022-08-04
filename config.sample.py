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
_default_locale = os.environ.get("GUWEB_default_locale")

_registration_allowed = os.environ.get("GUWEB_REGISTRATION_ALLOWED")
_create_api_key_if_not_exist = os.environ.get("GUWEB_CREATE_API_KEY_IF_NOT_EXIST")
_name_change_only_for_supporter = os.environ.get("GUWEB_NAME_CHANGE_ONLY_FOR_SUPPORTER")
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

# path to gulag root (must have leading and following slash),
# you don't need to change this assume you put /guweb and /bancho.py in the same folder.
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

# create api_key if not exist (admin panel update maps requires the api key)
create_api_key_if_not_exist = _create_api_key_if_not_exist if _create_api_key_if_not_exist is not None else False

# only supporters can change their username through user edit page
name_change_only_for_supporter = _name_change_only_for_supporter if _name_change_only_for_supporter is not None else True

default_locale = _default_locale if _default_locale is not None else 'en_GB'

# social links (used throughout guweb)
github = 'https://github.com/ppy-sb/guweb'
discord_invite_id = _discord_invite_id
discord_server = 'https://discord.com/invite/' + discord_invite_id if discord_invite_id is not None else None
youtube = 'https://youtube.com/'
twitter = 'https://twitter.com/'
instagram = 'https://instagram.com/'
