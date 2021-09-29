#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

__all__ = ()

import os

import aiohttp
import orjson
from quart import Quart
from quart import render_template

from cmyui.logging import Ansi
from cmyui.logging import log
from cmyui.mysql import AsyncSQLPool
from cmyui.version import Version

from objects import glob

app = Quart(__name__)

version = Version(1, 3, 0)

# used to secure session data.
# we recommend using a long randomly generated ascii string.
app.secret_key = glob.config.secret_key

@app.before_serving
async def mysql_conn() -> None:
    glob.db = AsyncSQLPool()
    await glob.db.connect(glob.config.mysql)
    log('Connected to MySQL!', Ansi.LGREEN)

@app.before_serving
async def http_conn() -> None:
    glob.http = aiohttp.ClientSession(json_serialize=orjson.dumps)
    log('Got our Client Session!', Ansi.LGREEN)

# globals which can be used in template code
_version = repr(version)
@app.before_serving
@app.template_global()
def appVersion() -> str:
    return _version

_app_name = glob.config.app_name
@app.before_serving
@app.template_global()
def appName() -> str:
    return _app_name

_captcha_key = glob.config.hCaptcha_sitekey
@app.before_serving
@app.template_global()
def captchaKey() -> str:
    return _captcha_key

_domain = glob.config.domain
@app.before_serving
@app.template_global()
def domain() -> str:
    return _domain

from blueprints.frontend import frontend
app.register_blueprint(frontend)

from blueprints.admin import admin
app.register_blueprint(admin, url_prefix='/admin')

from blueprints.api import api
app.register_blueprint(api, url_prefix='/gw_api')

@app.errorhandler(404)
async def page_not_found(e):
    # NOTE: we set the 404 status explicitly
    return (await render_template('404.html'), 404)

os.chdir(os.path.dirname(os.path.realpath(__file__)))
if __name__ == '__main__':
    app.run(debug=glob.config.debug) # blocking call
