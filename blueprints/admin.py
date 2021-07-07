# -*- coding: utf-8 -*-

__all__ = ()

import datetime
import timeago
import json
from quart import Blueprint
from quart import render_template
from quart import session
from quart import request
from quart import redirect

from objects import glob
from objects.utils import flash
from objects import varka

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
        return await flash('error', 'Please login first.', 'login')

    if not session['user_data']['is_staff']:
        return await flash('error', f'You have insufficient privileges.', 'home')

    # fetch data from database
    counts = await glob.db.fetch(
        'SELECT COUNT(id) count, '
        '(SELECT name FROM users ORDER BY id DESC LIMIT 1) AS `lastest_user`, '
        '(SELECT COUNT(id) FROM users WHERE NOT priv & 1) AS `banned` '
        'FROM users'
    )

    data = {
        "counts" : counts,
        "recent_users": await varka.get_users(),
        "recent_scores": await varka.get_scores()
    }

    return await render_template('admin/home.html', data=data)

@admin.route('/users', methods=['GET','POST'])
async def users():

    query_data = await glob.db.fetchall('SELECT name AS `username`, id, country FROM users ORDER BY id')

    if request.method == 'POST':
        global search_data
        error = 'User not found!'
        for i in await request.values:
            header = i
        if header == 'username':
            username = (await request.form)['username']
            search_data = await glob.db.fetchall(f'SELECT * FROM users WHERE name = "{ username }"')
            if not search_data:
                return await render_template('admin/users.html', query_data=query_data, search_data=search_data, error=error)
            return await render_template('admin/users.html', query_data=query_data, search_data=search_data)
        elif header == 'email':
            email = (await request.form)['email']
            search_data = await glob.db.fetchall(f'SELECT * FROM users WHERE email = "{ email }"')
            if not search_data:
                return await render_template('admin/users.html', query_data=query_data, search_data=search_data, error=error)
            return await render_template('admin/users.html', query_data=query_data, search_data=search_data)
    return await render_template('admin/users.html', query_data=query_data)

@admin.route('/users/update', methods=['GET', 'POST'])
async def up_user():
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
            return await render_template('admin/users.html', query_data=await varka.get_users(), error=error)
    return await render_template('admin/users.html', query_data=await varka.get_users())

@admin.route('/users/edit/<id>')
async def users_edit(id:int):
    query = await varka.get_user(id)
    return await render_template('admin/users_edit.html', search_data=query)

@admin.route('/users/update/<id>', methods=['POST']) # POST
async def users_update(id:int):
    form = await request.form
    datadef: dict = await get('users', id)
    data = dict(
        name = form['edit-username'],
        safe_name = form['edit-username'].lower().replace(' ', '_'),
        email = form['edit-email']
    )
    
    await varka.update('users', ('id', id), **dict_cmp(data, datadef))
    return redirect('/admin/users')

@admin.route('/reports')
async def reports():
    return await render_template('admin/reports.html')

@admin.route('/recentplay')
async def recentplay():
    return await render_template('admin/recentplay.html')

@admin.route('/restrictions')
async def restrictions():
    return await render_template('admin/restrictions.html')

@admin.route('/privilege')
async def privilege():
    return await render_template('admin/privilege.html')

@admin.route('/beatmaps')
async def beatmaps():
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
        'cs, od, ar, hp, bpm, diff AS `stars` '
        'FROM maps ORDER BY id DESC '
        'LIMIT 10 OFFSET 0'
    )
    return await render_template('admin/beatmaps.html', counts=counts, bmap_query=beatmaps)

@admin.route('/badges')
async def badges():
    return await render_template('admin/badges.html')

@admin.route('/logs')
async def logs():
    return await render_template('admin/log.html')
