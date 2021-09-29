__all__ = ()

#from cmyui.logging import Ansi
#from cmyui.logging import log
from quart import Blueprint
from quart import jsonify
from quart import request

from objects import glob
#from objects import utils

api = Blueprint('api', __name__)

""" /search_users"""
@api.route('/search_users') # GET
async def get_achievements():
    q = request.args.get('q', type=str)

    if not q:
        return b'{}'

    res = await glob.db.fetchall(
        'SELECT id, name '
        'FROM `users` '
        'WHERE priv >= 3 AND `name` LIKE %s '
        'LIMIT 5',
        [q.join("%%")]
    )

    if (len(res) == 0):
        return b'{}'
    else:
        return jsonify(res)