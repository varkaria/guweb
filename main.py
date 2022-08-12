#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

__all__ = ()

import os
import aiohttp
import i18n
import orjson
from quart import render_template
from cmyui.logging import Ansi
from cmyui.logging import log
from cmyui.mysql import AsyncSQLPool
from objects import glob
from objects.glob import app

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
