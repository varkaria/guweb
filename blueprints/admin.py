# -*- coding: utf-8 -*-

__all__ = ()

import datetime

import timeago
from quart import Blueprint
from quart import render_template
from quart import session

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
        datetime=datetime, timeago=timeago, header='Dashboard', isdashboard=True
    )

@admin.route('/reports')
async def reports():
    return await render_template('admin/reports.html', header='Reports')

@admin.route('/recentplay')
async def recentplay():
    return await render_template('admin/recentplay.html', header='Recent Play')

@admin.route('/restrictions')
async def restrictions():
    return await render_template('admin/restrictions.html', header='Restrictions')

@admin.route('/privilege')
async def privilege():
    return await render_template('admin/privilege.html', header='Privilege Groups')

@admin.route('/badges')
async def badges():
    return await render_template('admin/badges.html', header='Badges')

@admin.route('/logs')
async def logs():
    return await render_template('admin/log.html', header='Admin logs')