#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

__all__ = ()

import os
import time
from objects.privileges import Privileges

import markdown2
import html

import aiohttp
import i18n
import orjson
from quart import Quart, session
from quart import render_template

from cmyui.logging import Ansi
from cmyui.logging import log
from cmyui.mysql import AsyncSQLPool
from cmyui.version import Version

from objects import glob

app = Quart(__name__)

version = Version(1, 3, 5)

# used to secure session data.
# we recommend using a long randomly generated ascii string.
app.secret_key = glob.config.secret_key

@app.before_serving
async def mysql_conn() -> None:
    glob.db = AsyncSQLPool()
    await glob.db.connect(glob.config.mysql) # type: ignore
    log('Connected to MySQL!', Ansi.LGREEN)

@app.before_serving
async def load_lang():
    i18n.load_path.append(os.getcwd() + '/.locales')

@app.before_serving
async def http_conn() -> None:
    glob.http = aiohttp.ClientSession(json_serialize=lambda x: orjson.dumps(x).decode())
    log('Got our Client Session!', Ansi.LGREEN)

@app.after_serving
async def shutdown() -> None:
    await glob.db.close()
    await glob.http.close()

# globals which can be used in template code
@app.template_global()
def appVersion() -> str:
    return repr(version)

@app.template_global()
def t(key, **kwargs) -> str:
    kwargs['locale'] = session.get('lang', glob.config.default_locale)
    try:
        return i18n.t(key, **kwargs)
    except:
        try:
            return i18n.t(key + '._string', **kwargs)
        except:
            return key

@app.template_global()
def appName() -> str:
    return glob.config.app_name

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
def decode_map_status(status: int) -> str:
    if status == -1:
        return 'NotSubmitted'
    if status == 0:
        return 'Pending'
    if status == 1:
        return 'UpdateAvailable'
    if status == 2:
        return 'Ranked'
    if status == 3:
        return 'Approved'
    if status == 4:
        return 'Qualified'
    if status == 5:
        return 'Loved'

@app.template_global()
def captchaKey() -> str:
    return glob.config.hCaptcha_sitekey

@app.template_global()
def handle_timestamp(timestamp):
    return time.strftime("%Y-%m-%d %H:%M", time.localtime(int(timestamp)))

@app.template_global()
def domain() -> str:
    return glob.config.domain

@app.template_global()
def config():
    return glob.config

@app.template_global()
def render_markdown(md: str) -> str:
    return markdown2.markdown(html.unescape(md), extras=[
        'tables',
        'break-on-newline',
        'fenced-code-blocks',
        'spoiler',
        'strike'
    ])

from blueprints.frontend import frontend
app.register_blueprint(frontend)

from blueprints.admin import admin
app.register_blueprint(admin, url_prefix='/admin')

@app.errorhandler(404)
async def page_not_found(e):
    # NOTE: we set the 404 status explicitly
    return (await render_template('404.html'), 404)

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.realpath(__file__)))
    app.run(host='0.0.0.0', port=10000, debug=glob.config.debug)  # blocking call
