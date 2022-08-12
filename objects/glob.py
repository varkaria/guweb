# -*- coding: utf-8 -*-

__all__ = ('db', 'http', 'version', 'cache')

import os
import time
from quart import Quart, session
import i18n
import markdown2
import html
from aiohttp import ClientSession
from cmyui.mysql import AsyncSQLPool
from cmyui.version import Version
import config
from constants.beatmaps import RankedStatus
from constants.privileges import Privileges


db: 'AsyncSQLPool'
http: 'ClientSession'
version: 'Version'
app = Quart(__name__, template_folder=f'{os.getcwd()}/templates', static_folder=f'{os.getcwd()}/static')
version = Version(1, 3, 7)

cache = {
    'bcrypt': {},
    'search_data': {}
}

@app.template_global()
def t(key, **kwargs) -> str:
    kwargs['locale'] = session.get('lang', config.default_locale)
    try:
        return i18n.t(key, **kwargs)
    except:
        try:
            return i18n.t(key + '._string', **kwargs)
        except:
            return key

@app.template_global()
def appName() -> str:
    return config.app_name

@app.template_global()
def appVersion() -> str:
    return repr(version)

# Verified Unrestricted -> Normal
# Dangerous Admin Mod -> Stuff
# Supporter Premium -> Donator
# Not Verified -> Disclaimed
# Not Unrestricted -> Restricted
@app.template_global()
def decode_priv(target_priv: int) -> str:
    priv_list = [priv.name for priv in Privileges if target_priv & priv and bin(priv).count("1") == 1][::-1]
    if 'Unrestricted' not in priv_list:
        return 'Restricted'
    if 'Verified' not in priv_list:
        return 'Disclaimed'
    if set(['Verified', 'Unrestricted']).issubset(priv_list):
        priv_list.remove('Verified')
        priv_list.remove('Unrestricted')
        priv_list.append('Normal')
    if set(['Dangerous', 'Admin', 'Mod']).issubset(priv_list):
        priv_list.remove('Dangerous')
        priv_list.remove('Admin')
        priv_list.remove('Mod')
        priv_list.append('Stuff')
    if set(['Supporter', 'Premium']).issubset(priv_list):
        priv_list.remove('Supporter')
        priv_list.remove('Premium')
        priv_list.append('Donator')
    if 'Normal' in priv_list and len(priv_list) != 1:
        priv_list.remove('Normal')
    return ', '.join(priv_list)

@app.template_global()
def captchaKey() -> str:
    return config.hCaptcha_sitekey

@app.template_global()
def handle_timestamp(timestamp):
    return time.strftime("%Y-%m-%d %H:%M", time.localtime(int(timestamp)))

@app.template_global()
def domain() -> str:
    return config.domain

@app.template_global()
def render_markdown(md: str) -> str:
    return markdown2.markdown(html.unescape(md), extras=[
        'tables',
        'break-on-newline',
        'fenced-code-blocks',
        'spoiler',
        'strike'
    ])

@app.template_global()
def decode_map_status(status: int) -> str:
    return RankedStatus(status).name