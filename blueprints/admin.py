# -*- coding: utf-8 -*-

__all__ = ()

import datetime
from quart.helpers import url_for

import timeago
from quart import Blueprint
from quart import render_template
from quart import session
from quart import request
from quart import redirect

from objects import glob
from objects.utils import flash

admin = Blueprint('admin', __name__)

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
    dash_data = await glob.db.fetch(
        'SELECT COUNT(id) count, '
        '(SELECT name FROM users ORDER BY id DESC LIMIT 1) lastest_user, '
        '(SELECT COUNT(id) FROM users WHERE NOT priv & 1) banned '
        'FROM users'
    )

    recent_users = await glob.db.fetchall('SELECT * FROM users ORDER BY id DESC LIMIT 5')
    recent_scores = await glob.db.fetchall(
        'SELECT scores_vn.*, maps.artist, maps.title, '
        'maps.set_id, maps.creator, maps.version '
        'FROM scores_vn JOIN maps ON scores_vn.map_md5 = maps.md5 '
        'ORDER BY scores_vn.id DESC LIMIT 5'
    )

    return await render_template(
        'admin/home.html', dashdata=dash_data,
        recentusers=recent_users, recentscores=recent_scores,
        datetime=datetime, timeago=timeago
    )

@admin.route('/users', methods=['GET', 'POST'])
async def users():

    query_data = await glob.db.fetchall('SELECT name AS `username`, id FROM users ORDER BY id')

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
        form = await request.form
        for i in search_data:
            id = i['id']
        username = form['edit-username']
        email = form['edit-email']
        if not username and not email:
            return redirect('/admin/users')
        elif not username:
            await glob.db.execute(f'UPDATE users SET email="{email}" WHERE id={id}')
        elif not email:
            await glob.db.execute(f'UPDATE users SET name="{username}", safe_name=LOWER("{username}") WHERE id={id}')
        else:
            await glob.db.execute(f'UPDATE users SET name="{username}", safe_name=LOWER("{username}"), email="{email}" WHERE id={id}')
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
    r = await glob.db.fetchall('SELECT COUNT(id) as `r` FROM maps WHERE `status`=2')
    l = await glob.db.fetchall('SELECT COUNT(id) as `l` FROM maps WHERE `status`=5')
    p = await glob.db.fetchall('SELECT COUNT(id) as `p` FROM maps WHERE `status`=0')
    t = await glob.db.fetchall('SELECT COUNT(id) as `t` FROM maps')
    data = {"ranked": r[0]['r'], "loved": l[0]['l'], "pending": p[0]['p'], "total": t[0]['t']}
    #This needs to be moved to api
    bmaps = await glob.db.fetchall(f'SELECT set_id, id AS `map_id`, status, artist, title, version AS `diff_name`, total_length AS length, creator, mode, cs, od, ar, hp, bpm, diff AS `stars` FROM maps ORDER BY set_id ASC LIMIT 10 OFFSET 0')
    print(bmaps)
    return await render_template('admin/beatmaps.html', data=data, bmap_query=bmaps)

@admin.route('/badges')
async def badges():
    return await render_template('admin/badges.html')

@admin.route('/logs')
async def logs():
    return await render_template('admin/log.html')
