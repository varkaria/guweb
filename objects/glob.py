# -*- coding: utf-8 -*-

__all__ = ('db', 'http', 'version', 'cache')

from typing import TYPE_CHECKING

import config  # imported for indirect use

if TYPE_CHECKING:
    from aiohttp import ClientSession
    from cmyui.mysql import AsyncSQLPool
    from cmyui.version import Version

db: 'AsyncSQLPool'
http: 'ClientSession'
version: 'Version'

cache = {
    'bcrypt': {}
}
