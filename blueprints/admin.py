# -*- coding: utf-8 -*-

__all__ = ()

from quart import Blueprint
from quart import render_template
from quart import session
from quart import request
from quart import redirect
from quart import jsonify

from objects import glob
from objects.utils import flash
from objects import varka

import datetime
import timeago
from blueprints.i18npy import t

admin = Blueprint('admin', __name__)

def dict_cmp(a: dict, b: dict):
    cmp = a.items() - b.items()
    return dict(cmp)

async def get(table_name: str, id: str):
    data = await varka.get_data(table_name, id)
    return data

@admin.route('/')
@admin.route('/home')
@admin.route('/dashboard')
async def home():
    """Render the homepage of guweb's admin panel."""
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')

    # fetch data from database
    dash_data = await glob.db.fetch(
        'SELECT COUNT(id) count, '
        '(SELECT name FROM users ORDER BY id DESC LIMIT 1) lastest_user, '
        '(SELECT COUNT(id) FROM users WHERE NOT priv & 1) banned '
        'FROM users'
    )

    recent_users = await glob.db.fetchall('SELECT * FROM users ORDER BY id DESC LIMIT 5')
    recent_scores = await glob.db.fetchall(
        'SELECT scores.*, maps.artist, maps.title, '
        'maps.set_id, maps.creator, maps.version '
        'FROM scores JOIN maps ON scores.map_md5 = maps.md5 '
        'ORDER BY scores.id DESC LIMIT 5'
    )

    return await render_template(
        'admin/home.html', dashdata=dash_data,
        recentusers=recent_users, recentscores=recent_scores,
        datetime=datetime, timeago=timeago
    )

@admin.route('/users', methods=['GET'])
async def users():
    """Render the homepage of guweb's admin panel."""
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')
    result = request.args.get('search', type=str)
    if result is None:
        query_data = await varka.get_users()
        result = ''
    else:
        query_data = await varka.get_users(search=result)
    return await render_template('admin/users.html', query_data=query_data, search_value=result)

@admin.route('/users/edit/<id>')
async def users_edit(id:int):
    """Render the homepage of guweb's admin panel."""
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')
    
    query = await varka.get_user(id)
    return await render_template('admin/users_edit.html', search_data=query)

@admin.route('/beatmaps/edit/<bid>')
async def beatmaps_edit(bid:int):
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff'] and not session['user_data']['is_bn']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')
    
    status = request.args.get('status', type=int)
    is_set = request.args.get('set', type=int) == 1
    if is_set:
        await glob.db.execute("UPDATE maps SET frozen=1, status=%s WHERE set_id=%s", [str(status), str(bid)])
    else:
        await glob.db.execute("UPDATE maps SET frozen=1, status=%s WHERE id=%s", [str(status), str(bid)])

    query = await glob.db.fetch(
        'SELECT (SELECT COUNT(id) as `r` FROM maps WHERE `status`= 2) AS `r`, '
        '(SELECT COUNT(id) as `l` FROM maps WHERE `status`= 5) AS `l`, '
        '(SELECT COUNT(id) as `p` FROM maps WHERE `status`= 0) AS `p`, '
        '(SELECT COUNT(id) as `t` FROM maps) `t`'
    )
    counts = {
        "ranked": query['r'], 
        "loved": query['l'], 
        "pending": query['p'], 
        "total": query['t']
    }
    if is_set:
        beatmaps = await glob.db.fetchall(
        'SELECT set_id, id AS `map_id`, status, '
        'artist, title, version AS `diff_name`, '
        'total_length AS length, creator, mode, '
        'cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` '
        'FROM maps WHERE set_id=%s ORDER BY id DESC '
        'LIMIT 50 OFFSET 0', [str(bid)])
    else:
        beatmaps = await glob.db.fetchall(
        'SELECT set_id, id AS `map_id`, status, '
        'artist, title, version AS `diff_name`, '
        'total_length AS length, creator, mode, '
        'cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` '
        'FROM maps WHERE id=%s ORDER BY id DESC '
        'LIMIT 50 OFFSET 0', [str(bid)])
    return await render_template('admin/beatmaps.html', counts=counts, bmap_query=beatmaps, search_word=str(bid))

@admin.route('/users/update/<id>', methods=['POST']) # POST
async def users_update(id:int):
    """Render the homepage of guweb's admin panel."""
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')

    try:
        form = await request.form
        datadef: dict = await get('users', id)
        data = dict(
            name = form['edit-username'],
            safe_name = form['edit-username'].lower().replace(' ', '_'),
            email = form['edit-email'],
            country = form['edit-country']
        )
        if form['legality'] == 'restricted':
            data['priv'] = 2
        elif datadef['priv'] == 2 and form['legality'] == 'unrestricted':
            data['priv'] = 3 
        await varka.update('users', ('id', id), **dict_cmp(data, datadef))
        return redirect('/admin/users')
    except: 
        return redirect('/admin/users')

@admin.route('/restrictions', methods=['GET', 'POST'])
async def restrictions():
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')

    error = ''
    if request.method == 'POST':
        try:
            try:
                username = (await request.form)['username']
                id = (await varka.get_user_username(username))['id']
                return redirect(f'/admin/users/edit/{id}')
            except:
                email = (await request.form)['email']
                id = (await varka.get_user_email(email))['id']
                return redirect(f'/admin/users/edit/{id}')
        except:
            error = 'User not found!'
    return await render_template('admin/restrictions.html', query_data=await varka.get_res_users(), error=error)

@admin.route('/beatmaps/<mode>')
async def beatmaps(mode: str):
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff'] and not session['user_data']['is_bn']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')

    mode_vn = 0
    if mode == 'taiko':
        mode_vn = 1
    if mode == 'catch':
        mode_vn = 2
    if mode == 'mania':
        mode_vn = 3
    query = await glob.db.fetch(
        'SELECT (SELECT COUNT(id) as `r` FROM maps WHERE `status`= 2) AS `r`, '
        '(SELECT COUNT(id) as `l` FROM maps WHERE `status`= 5) AS `l`, '
        '(SELECT COUNT(id) as `p` FROM maps WHERE `status`= 0) AS `p`, '
        '(SELECT COUNT(id) as `t` FROM maps) `t`'
    )
    counts = {
        "ranked": query['r'], 
        "loved": query['l'], 
        "pending": query['p'], 
        "total": query['t']
    }
    # This thing needs to be moved to API
    beatmaps = await glob.db.fetchall(
        'SELECT set_id, id AS `map_id`, status, '
        'artist, title, version AS `diff_name`, '
        'total_length AS length, creator, mode, '
        'cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` '
        'FROM maps WHERE mode=%s ORDER BY id DESC '
        'LIMIT 50 OFFSET 0', [mode_vn]
    )
    return await render_template('admin/beatmaps.html', counts=counts, bmap_query=beatmaps)

@admin.route('/beatmaps/search')
async def beatmaps_search():
    if not 'authenticated' in session:
        return await flash('error', t('admin.please-login-in-first'), 'login')

    if not session['user_data']['is_staff'] and not session['user_data']['is_bn']:
        return await flash('error', t('admin.you-have-sufficient-privileges'), 'home')

    query = await glob.db.fetch(
        'SELECT (SELECT COUNT(id) as `r` FROM maps WHERE `status`= 2) AS `r`, '
        '(SELECT COUNT(id) as `l` FROM maps WHERE `status`= 5) AS `l`, '
        '(SELECT COUNT(id) as `p` FROM maps WHERE `status`= 0) AS `p`, '
        '(SELECT COUNT(id) as `t` FROM maps) `t`'
    )
    counts = {
        "ranked": query['r'], 
        "loved": query['l'], 
        "pending": query['p'], 
        "total": query['t']
    }
    bid = request.args.get('bid', type=str)
    sid = request.args.get('sid', type=str)
    name = request.args.get('name', type=str)
    word = ''
    if bid != None:
        word = str(bid)
        beatmaps = await glob.db.fetchall(
        'SELECT set_id, id AS `map_id`, status, '
        'artist, title, version AS `diff_name`, '
        'total_length AS length, creator, mode, '
        'cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` '
        'FROM maps WHERE id=%s ORDER BY id DESC '
        'LIMIT 50 OFFSET 0', [bid]
    )

    if sid != None:
        word = str(sid)
        beatmaps = await glob.db.fetchall(
        'SELECT set_id, id AS `map_id`, status, '
        'artist, title, version AS `diff_name`, '
        'total_length AS length, creator, mode, '
        'cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` '
        'FROM maps WHERE set_id=%s ORDER BY id DESC '
        'LIMIT 50 OFFSET 0', [sid]
    )

    if name != None:
        word = str(name)
        beatmaps = await glob.db.fetchall(
        'SELECT set_id, id AS `map_id`, status, '
        'artist, title, version AS `diff_name`, '
        'total_length AS length, creator, mode, '
        'cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` '
        'FROM maps WHERE title like %s ORDER BY id DESC '
        'LIMIT 50 OFFSET 0', [name + '%']
    )
    return await render_template('admin/beatmaps.html', counts=counts, bmap_query=beatmaps, search_word=word)


@admin.route('/beatmaps')
async def beatmaps_noargs():
    return await beatmaps('osu')