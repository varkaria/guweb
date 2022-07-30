from quart import Blueprint
from quart import jsonify
from quart import request

from objects import glob

api = Blueprint('apiv1', __name__)

@api.route('/search')
async def home():
    q = request.args.get('q', type=str)
    if not q:
        return b'{}'

    res = await glob.db.fetchall(
        'SELECT id, name '
        'FROM `users` '
        'WHERE priv >= 3 AND `name` LIKE %s '
        'LIMIT 5',
        [q + '%%']
    )

    if (len(res) == 0):
        return b'{}'
    else:
        return jsonify(res) 