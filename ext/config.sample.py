# -*- coding: utf-8 -*-

# app name
app_name = 'guweb'

# secret key
secret_key = 'changeme'

#hCaptcha settings:
hCaptcha_sitekey = 'changeme'
hCaptcha_secret = 'changeme'

# domain (used for api, avatar, etc)
domain = 'kurai.pw'

# max image size for avatars, in megabytes
max_image_size = 2

# mysql credentials
mysql = {
    'db': 'kurai.pw',
    'host': 'localhost',
    'user': 'kurai.pw',
    'password': 'kurai.pw',
}

# path to bancho.py root (must have leading and following slash)
path_to_gulag = '/root/kurai.pw/'

path = '/root/web-kurai.pw/'

# enable debug (disable when in production to improve performance)
debug = False

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
registration = True

# social links (used throughout guweb)
github = 'https://github.com/hzswdef/web-kurai.pw'
discord_server = 'https://discord.com/invite/Fn2ZRmEpy7'
switcher = 'https://github.com/hzswdef/osu-kurai-switcher/releases/download/stable-1.1/kurai.switcher.exe'
topg = 'https://topg.org/osu-private-servers/server-652942'

# status site
status = 'https://status.kurai.pw/'