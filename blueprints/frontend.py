# -*- coding: utf-8 -*-

__all__ = ()

import bcrypt
import hashlib
import os
import time
import uuid


from cmyui.logging import Ansi
from cmyui.logging import log
from functools import wraps
from PIL import Image
from pathlib import Path
from quart import Blueprint
from quart import redirect
from quart import render_template
from quart import request
from quart import session
from quart import send_file
from quart import jsonify

from constants import regexes
from objects import glob
from objects import utils
from objects.privileges import Privileges
from objects.utils import flash
from objects.utils import flash_with_customizations

from blueprints.i18npy import t

VALID_MODES = frozenset({'std', 'taiko', 'catch', 'mania'})
VALID_MODS = frozenset({'vn', 'rx', 'ap'})

frontend = Blueprint('frontend', __name__)


def login_required(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        if not session:
            return await flash('error', t('global.you-must-be-logged-in-to-access-this-page'), 'login')
        return await func(*args, **kwargs)
    return wrapper

@frontend.route('/home')
@frontend.route('/')
async def home():
    return await render_template('home.html')

@frontend.route('/home/account/edit')
async def home_account_edit():
    return redirect('/settings/profile')

@frontend.route('/settings')
@frontend.route('/settings/profile')
@login_required
async def settings_profile():
    return await render_template('settings/profile.html')

@frontend.route('/settings/profile', methods=['POST'])
@login_required
async def settings_profile_post():
    form = await request.form

    new_name = form.get('username', type=str)
    new_email = form.get('email', type=str)

    if new_name is None or new_email is None:
        return await flash('error', t('global.invalid-parameters'), 'home')

    old_name = session['user_data']['name']
    old_email = session['user_data']['email']

    # no data has changed; deny post
    if (
        new_name == old_name and
        new_email == old_email
    ):
        return await flash('error', t('settings.profile.no-changes-have-been-made'), 'settings/profile')

    if new_name != old_name:
        # Usernames must:
        # - be within 2-15 characters in length
        # - not contain both ' ' and '_', one is fine
        # - not be in the config's `disallowed_names` list
        # - not already be taken by another player
        if not regexes.username.match(new_name):
            return await flash('error', t('settings.profile.new-username-is-invalid'), 'settings/profile')

        if '_' in new_name and ' ' in new_name:
            return await flash('error', t('settings.profile.new-username-cannot-contains-both-dash-and-space'), 'settings/profile')

        if new_name in glob.config.disallowed_names:
            return await flash('error', t('settings.profile.new-username-disallowed'), 'settings/profile')

        if await glob.db.fetch('SELECT 1 FROM users WHERE name = %s', [new_name]):
            return await flash('error', t('settings.profile.new-username-already-taken-by-others'), 'settings/profile')

        safe_name = utils.get_safe_name(new_name)

        # username change successful
        await glob.db.execute(
            'UPDATE users '
            'SET name = %s, safe_name = %s '
            'WHERE id = %s',
            [new_name, safe_name, session['user_data']['id']]
        )

    if new_email != old_email:
        # Emails must:
        # - match the regex `^[^@\s]{1,200}@[^@\s\.]{1,30}\.[^@\.\s]{1,24}$`
        # - not already be taken by another player
        if not regexes.email.match(new_email):
            return await flash('error', t('settings.profile.new-email-is-invalid'), 'settings/profile')

        if await glob.db.fetch('SELECT 1 FROM users WHERE email = %s', [new_email]):
            return await flash('error', '', 'settings/profile')

        # email change successful
        await glob.db.execute(
            'UPDATE users '
            'SET email = %s '
            'WHERE id = %s',
            [new_email, session['user_data']['id']]
        )

    # logout
    session.pop('authenticated', None)
    session.pop('user_data', None)
    return await flash('success', t('settings.profile.succeed-please-login-again'), 'login')

@frontend.route('/settings/avatar')
@login_required
async def settings_avatar():
    return await render_template('settings/avatar.html')

@frontend.route('/settings/avatar', methods=['POST'])
@login_required
async def settings_avatar_post():
    # constants
    AVATARS_PATH = f'{glob.config.path_to_gulag}/.data/avatars'
    ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png']

    avatar = (await request.files).get('avatar')

    # no file uploaded; deny post
    if avatar is None or not avatar.filename:
        return await flash('error', t('settings.no-image-was-selected'), 'settings/avatar')

    filename, file_extension = os.path.splitext(avatar.filename.lower())

    # bad file extension; deny post
    if not file_extension in ALLOWED_EXTENSIONS:
        return await flash('error', t('settings.bad-image-extension', something = t('settings.avatar').lower()), 'settings/avatar')

    # remove old avatars
    for fx in ALLOWED_EXTENSIONS:
        if os.path.isfile(f'{AVATARS_PATH}/{session["user_data"]["id"]}{fx}'): # Checking file e
            os.remove(f'{AVATARS_PATH}/{session["user_data"]["id"]}{fx}')

    # avatar cropping to 1:1
    pilavatar = Image.open(avatar.stream)

    # avatar change success
    pilavatar = utils.crop_image(pilavatar)
    pilavatar.save(os.path.join(AVATARS_PATH, f'{session["user_data"]["id"]}{file_extension.lower()}'))
    return await flash('success', t('settings.change-succeed', something = t('settings.avatar').lower()), 'settings/avatar')

@frontend.route('/settings/custom')
@login_required
async def settings_custom():
    profile_customizations = utils.has_profile_customizations(session['user_data']['id'])
    return await render_template('settings/custom.html', customizations=profile_customizations)

@frontend.route('/settings/custom', methods=['POST'])
@login_required
async def settings_custom_post():
    files = await request.files
    banner = files.get('banner')
    background = files.get('background')
    ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.gif']

    # no file uploaded; deny post
    if banner is None and background is None:
        return await flash_with_customizations('error', t('settings.no-image-was-selected'), 'settings/custom')

    if banner is not None and banner.filename:
        _, file_extension = os.path.splitext(banner.filename.lower())
        if not file_extension in ALLOWED_EXTENSIONS:
            return await flash_with_customizations('error', t('settings.bad-image-extension', something = t('settings.banner').lower()), 'settings/custom')

        banner_file_no_ext = os.path.join(f'.data/banners', f'{session["user_data"]["id"]}')

        # remove old picture
        for ext in ALLOWED_EXTENSIONS:
            banner_file_with_ext = f'{banner_file_no_ext}{ext}'
            if os.path.isfile(banner_file_with_ext):
                os.remove(banner_file_with_ext)

        await banner.save(f'{banner_file_no_ext}{file_extension}')

    if background is not None and background.filename:
        _, file_extension = os.path.splitext(background.filename.lower())
        if not file_extension in ALLOWED_EXTENSIONS:
            return await flash_with_customizations('error', t('settings.bad-image-extension', something = t('settings.background').lower()), 'settings/custom')

        background_file_no_ext = os.path.join(f'.data/backgrounds', f'{session["user_data"]["id"]}')

        # remove old picture
        for ext in ALLOWED_EXTENSIONS:
            background_file_with_ext = f'{background_file_no_ext}{ext}'
            if os.path.isfile(background_file_with_ext):
                os.remove(background_file_with_ext)

        await background.save(f'{background_file_no_ext}{file_extension}')

    return await flash_with_customizations('success', t('settings.change-succeed', something = t('settings.customization').lower()), 'settings/custom')

@frontend.route('/settings/aboutme')
@login_required
async def settings_aboutme():
    user = await glob.db.fetch(
        'SELECT userpage_content FROM users WHERE id = %s',
        [session['user_data']['id']]
    )
    return await render_template('settings/aboutme.html', userpage_content=user['userpage_content'])

@frontend.route('/settings/aboutme', methods=['POST'])
@login_required
async def settings_aboutme_post():
    form = await request.form
    userpage_content = form.get('userpage_content', type=str)
    safe_content = userpage_content.lower()
    if '<iframe' in safe_content or '<script' in safe_content:
        return await render_template('settings/aboutme.html', flash='Not allowed method', status='error', userpage_content=userpage_content)
    if (len(userpage_content) > 2048):
        return await render_template('settings/aboutme.html', flash='Too long text', status='error', userpage_content=userpage_content)
    await glob.db.execute(
            'UPDATE users '
            'SET userpage_content = %s '
            'WHERE id = %s',
            [userpage_content, session['user_data']['id']]
        )
    session['user_data']['userpage_content'] = userpage_content
    return await render_template('settings/aboutme.html', userpage_content=userpage_content)

@frontend.route('/settings/password')
@login_required
async def settings_password():
    return await render_template('settings/password.html')

@frontend.route('/forgot')
async def reset_password():
    return await render_template('forgot.html')

@frontend.route('/settings/password', methods=["POST"])
@login_required
async def settings_password_post():
    form = await request.form
    old_password = form.get('old_password')
    new_password = form.get('new_password')
    repeat_password = form.get('repeat_password')

    # new password and repeat password don't match; deny post
    if new_password != repeat_password:
        return await flash('error', t('settings.password.new-passoword-mismatch-repeated-password'), 'settings/password')

    # new password and old password match; deny post
    if old_password == new_password:
        return await flash('error', t('settings.password.new-passoword-cannot-be-same-as-old-password'), 'settings/password')

    # Passwords must:
    # - be within 8-32 characters in length
    # - have more than 3 unique characters
    # - not be in the config's `disallowed_passwords` list
    if not 8 < len(new_password) <= 32:
        return await flash('error', t('settings.password.must-between-8-32-characters-in-length'), 'settings/password')

    if len(set(new_password)) <= 3:
        return await flash('error', t('settings.password.must-have-more-than-3-unique-characters'), 'settings/password')

    if new_password.lower() in glob.config.disallowed_passwords:
        return await flash('error', t('settings.password.too-simple'), 'settings/password')

    # cache and other password related information
    bcrypt_cache = glob.cache['bcrypt']
    pw_bcrypt = (await glob.db.fetch(
        'SELECT pw_bcrypt '
        'FROM users '
        'WHERE id = %s',
        [session['user_data']['id']])
    )['pw_bcrypt'].encode()

    pw_md5 = hashlib.md5(old_password.encode()).hexdigest().encode()

    # check old password against db
    # intentionally slow, will cache to speed up
    if pw_bcrypt in bcrypt_cache:
        if pw_md5 != bcrypt_cache[pw_bcrypt]: # ~0.1ms
            if glob.config.debug:
                log(f"{session['user_data']['name']}'s change pw failed - pw incorrect.", Ansi.LYELLOW)
            return await flash('error', t('settings.password.old-password-incorrect'), 'settings/password')
    else: # ~200ms
        if not bcrypt.checkpw(pw_md5, pw_bcrypt):
            if glob.config.debug:
                log(f"{session['user_data']['name']}'s change pw failed - pw incorrect.", Ansi.LYELLOW)
            return await flash('error', t('settings.password.old-password-incorrect'), 'settings/password')

    # remove old password from cache
    if pw_bcrypt in bcrypt_cache:
        del bcrypt_cache[pw_bcrypt]

    # calculate new md5 & bcrypt pw
    pw_md5 = hashlib.md5(new_password.encode()).hexdigest().encode()
    pw_bcrypt = bcrypt.hashpw(pw_md5, bcrypt.gensalt())

    # update password in cache and db
    bcrypt_cache[pw_bcrypt] = pw_md5
    await glob.db.execute(
        'UPDATE users '
        'SET pw_bcrypt = %s '
        'WHERE safe_name = %s',
        [pw_bcrypt, utils.get_safe_name(session['user_data']['name'])]
    )

    # logout
    session.pop('authenticated', None)
    session.pop('user_data', None)
    return await flash('success', t('settings.change-succeed', something = t('global.password')), 'login')


@frontend.route('/u/<id>')
async def profile_select(id):

    mode = request.args.get('mode', 'std', type=str) # 1. key 2. default value
    mods = request.args.get('mods', 'vn', type=str)
    user_data = await glob.db.fetch(
        'SELECT name, safe_name, id, priv, country, userpage_content '
        'FROM users '
        'WHERE safe_name = %s OR id = %s LIMIT 1',
        [utils.get_safe_name(id), id]
    )

    # no user and no bot page
    if not user_data or user_data["id"] == 1:
        return (await render_template('404.html'), 404)

    # make sure mode & mods are valid args
    if mode is not None and mode not in VALID_MODES:
        return (await render_template('404.html'), 404)

    if mods is not None and mods not in VALID_MODS:
        return (await render_template('404.html'), 404)

    is_staff = 'authenticated' in session and session['user_data']['is_staff']
    if not user_data or not (user_data['priv'] & Privileges.Normal or is_staff):
        return (await render_template('404.html'), 404)

    user_data['customisation'] = utils.has_profile_customizations(user_data['id'])
    return await render_template('profile.html', user=user_data, mode=mode, mods=mods)


@frontend.route('/leaderboard')
@frontend.route('/lb')
@frontend.route('/leaderboard/<mode>/<sort>/<mods>')
@frontend.route('/lb/<mode>/<sort>/<mods>')
async def leaderboard(mode='std', sort='pp', mods='vn'):
    return await render_template('leaderboard.html', mode=mode, sort=sort, mods=mods)

@frontend.route('/login')
async def login():
    if 'authenticated' in session:
        return await flash('error', t('global.you-are-already-logged-in'), 'home')

    return await render_template('login.html')

@frontend.route('/login', methods=['POST'])
async def login_post():
    if 'authenticated' in session:
        return await flash('error', t('global.you-are-already-logged-in'), 'home')

    if glob.config.debug:
        login_time = time.time_ns()

    form = await request.form
    username = form.get('username', type=str)
    passwd_txt = form.get('password', type=str)

    if username is None or passwd_txt is None:
        return await flash('error', t('global.invalid-parameters'), 'home')

    # check if account exists
    user_info = await glob.db.fetch(
        'SELECT id, name, email, priv, '
        'pw_bcrypt, silence_end, api_key, userpage_content '
        'FROM users '
        'WHERE safe_name = %s',
        [utils.get_safe_name(username)]
    )

    # user doesn't exist; deny post
    # NOTE: Bot isn't a user.
    if not user_info or user_info['id'] == 1:
        if glob.config.debug:
            log(f"{username}'s login failed - account doesn't exist.", Ansi.LYELLOW)
        return await flash('error', t('login.account-does-not-exist'), 'login')

    # cache and other related password information
    bcrypt_cache = glob.cache['bcrypt']
    pw_bcrypt = user_info['pw_bcrypt'].encode()
    pw_md5 = hashlib.md5(passwd_txt.encode()).hexdigest().encode()

    # check credentials (password) against db
    # intentionally slow, will cache to speed up
    if pw_bcrypt in bcrypt_cache:
        if pw_md5 != bcrypt_cache[pw_bcrypt]: # ~0.1ms
            if glob.config.debug:
                log(f"{username}'s login failed - pw incorrect.", Ansi.LYELLOW)
            return await flash('error', t('login.password-incorrect'), 'login')
    else: # ~200ms
        if not bcrypt.checkpw(pw_md5, pw_bcrypt):
            if glob.config.debug:
                log(f"{username}'s login failed - pw incorrect.", Ansi.LYELLOW)
            return await flash('error', t('login.password-incorrect'), 'login')

        # login successful; cache password for next login
        bcrypt_cache[pw_bcrypt] = pw_md5

    # user not verified; render verify
    if not user_info['priv'] & Privileges.Verified:
        if glob.config.debug:
            log(f"{username}'s login failed - not verified.", Ansi.LYELLOW)
        return await render_template('verify.html')

    # user banned; deny post
    if not user_info['priv'] & Privileges.Normal:
        if glob.config.debug:
            log(f"{username}'s login failed - banned.", Ansi.RED)
        return await flash('error', t('login.restricted-not-allowed-to-login'), 'login')

    api_key = user_info['api_key']

    if api_key is None:
        api_key = str(uuid.uuid4())
        await glob.db.execute(
        "UPDATE users SET api_key = %s WHERE id = %s",
        [api_key, user_info['id']]
    )

    # login successful; store session data
    if glob.config.debug:
        log(f"{username}'s login succeeded.", Ansi.LGREEN)

    session['authenticated'] = True
    session['user_data'] = {
        'id': user_info['id'],
        'name': user_info['name'],
        'email': user_info['email'],
        'priv': user_info['priv'],
        'api_key': api_key,
        'silence_end': user_info['silence_end'],
        'userpage_content': user_info['userpage_content'],
        'is_staff': user_info['priv'] & Privileges.Staff != 0,
        'is_bn': user_info['priv'] & Privileges.Nominator != 0,
        'is_donator': user_info['priv'] & Privileges.Donator != 0
    }

    if glob.config.debug:
        login_time = (time.time_ns() - login_time) / 1e6
        log(f'Login took {login_time:.2f}ms!', Ansi.LYELLOW)

    return await flash('success', t('login.welcome-back', username = username), 'home')

@frontend.route('/register')
async def register():
    if 'authenticated' in session:
        return await flash('error', t('global.you-are-already-logged-in'), 'home')

    if not glob.config.registration:
        return await flash('error', t('register.currently-disabled'), 'home')

    return await render_template('register.html')

@frontend.route('/register', methods=['POST'])
async def register_post():
    if 'authenticated' in session:
        return await flash('error', t('global.you-are-already-logged-in'), 'home')

    if not glob.config.registration:
        return await flash('error', t('register.currently-disabled'), 'home')

    form = await request.form
    username = form.get('username', type=str)
    email = form.get('email', type=str)
    passwd_txt = form.get('password', type=str)

    if username is None or email is None or passwd_txt is None:
        return await flash('error', t('global.invalid-parameters'), 'home')

    if glob.config.hCaptcha_sitekey != 'changeme':
        captcha_data = form.get('h-captcha-response', type=str)
        if (
            captcha_data is None or
            not await utils.validate_captcha(captcha_data)
        ):
            return await flash('error', t('register.captcha-failed'), 'register')

    # Usernames must:
    # - be within 2-15 characters in length
    # - not contain both ' ' and '_', one is fine
    # - not be in the config's `disallowed_names` list
    # - not already be taken by another player
    # check if username exists
    if not regexes.username.match(username):
        return await flash('error', t('register.username-syntax-is-invalid'), 'register')

    if '_' in username and ' ' in username:
        return await flash('error', t('register.username-cannot-contains-both-dash-and-space'), 'register')

    if username in glob.config.disallowed_names:
        return await flash('error', t('register.username-disallowed'), 'register')

    if await glob.db.fetch('SELECT 1 FROM users WHERE name = %s', username):
        return await flash('error', t('register.username-already-taken-by-others'), 'register')

    # Emails must:
    # - match the regex `^[^@\s]{1,200}@[^@\s\.]{1,30}\.[^@\.\s]{1,24}$`
    # - not already be taken by another player
    if not regexes.email.match(email):
        return await flash('error', t('register.email-is-invalid'), 'register')

    if await glob.db.fetch('SELECT 1 FROM users WHERE email = %s', email):
        return await flash('error', t('register.email-already-taken'), 'register')

    # Passwords must:
    # - be within 8-32 characters in length
    # - have more than 3 unique characters
    # - not be in the config's `disallowed_passwords` list
    if not 8 <= len(passwd_txt) <= 32:
        return await flash('error', t('register.password.must-between-8-32-characters-in-length'), 'register')

    if len(set(passwd_txt)) <= 3:
        return await flash('error', t('register.password.must-have-more-than-3-unique-characters'), 'register')

    if passwd_txt.lower() in glob.config.disallowed_passwords:
        return await flash('error', t('register.password.too-simple'), 'register')

    # TODO: add correct locking
    # (start of lock)
    pw_md5 = hashlib.md5(passwd_txt.encode()).hexdigest().encode()
    pw_bcrypt = bcrypt.hashpw(pw_md5, bcrypt.gensalt())
    glob.cache['bcrypt'][pw_bcrypt] = pw_md5 # cache pw

    safe_name = utils.get_safe_name(username)

    # fetch the users' country
    if (
        request.headers and
        (ip := request.headers.get('X-Real-IP', type=str)) is not None
    ):
        country = await utils.fetch_geoloc(ip)
    else:
        country = 'xx'

    async with glob.db.pool.acquire() as conn:
        async with conn.cursor() as db_cursor:
            # add to `users` table.
            await db_cursor.execute(
                'INSERT INTO users '
                '(name, safe_name, email, pw_bcrypt, country, creation_time, latest_activity) '
                'VALUES (%s, %s, %s, %s, %s, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())',
                [username, safe_name, email, pw_bcrypt, country]
            )
            user_id = db_cursor.lastrowid

            # add to `stats` table.
            await db_cursor.executemany(
                'INSERT INTO stats '
                '(id, mode) VALUES (%s, %s)',
                [(user_id, mode) for mode in (
                    0,  # vn!std
                    1,  # vn!taiko
                    2,  # vn!catch
                    3,  # vn!mania
                    4,  # rx!std
                    5,  # rx!taiko
                    6,  # rx!catch
                    8,  # ap!std
                )]
            )

    # (end of lock)

    if glob.config.debug:
        log(f'{username} has registered - awaiting verification.', Ansi.LGREEN)

    # user has successfully registered
    return await render_template('verify.html')

@frontend.route('/logout')
async def logout():
    if 'authenticated' not in session:
        return await flash('error', t('logout.cannot-logout-if-not-logged-in'), 'login')

    if glob.config.debug:
        log(f'{session["user_data"]["name"]} logged out.', Ansi.LGREEN)

    # clear session data
    session.pop('authenticated', None)
    session.pop('user_data', None)

    # render login
    return await flash('success', t('logout.succeed'), 'login')

@frontend.route('/search')
async def search_user():
    q = request.args.get('q', type=str)
    if not q:
        return b'{}'

    res = await glob.db.fetchall(
        'SELECT id, name '
        'FROM `users` '
        'WHERE priv >= 3 '
        'AND ('
        '   `name` LIKE %s '
        '   OR CONVERT(`id`, char) LIKE %s '
        ') LIMIT 5',
        [q + '%%', q + '%%']
    )

    if (len(res) == 0):
        return b'{}'
    else:
        return jsonify(res) 

# social media redirections

@frontend.route('/github')
@frontend.route('/gh')
async def github_redirect():
    return redirect(glob.config.github)

@frontend.route('/discord')
async def discord_redirect():
    return redirect(glob.config.discord_server)

@frontend.route('/youtube')
@frontend.route('/yt')
async def youtube_redirect():
    return redirect(glob.config.youtube)

@frontend.route('/twitter')
async def twitter_redirect():
    return redirect(glob.config.twitter)

@frontend.route('/instagram')
@frontend.route('/ig')
async def instagram_redirect():
    return redirect(glob.config.instagram)

# profile customisation
BANNERS_PATH = Path.cwd() / '.data/banners'
BACKGROUND_PATH = Path.cwd() / '.data/backgrounds'
@frontend.route('/banners/<user_id>')
async def get_profile_banner(user_id: int):
    # Check if avatar exists
    for ext in ('jpg', 'jpeg', 'png', 'gif'):
        path = BANNERS_PATH / f'{user_id}.{ext}'
        if path.exists():
            return await send_file(path)

    return b'{"status":404}'

@frontend.route('/language/<lang>/<path:path>')
@frontend.route('/language/<lang>', defaults = {'path' : 'home'})
async def set_language(lang: str, path: str):
    session['lang'] = lang
    return redirect('/' + path)


@frontend.route('/backgrounds/<user_id>')
async def get_profile_background(user_id: int):
    # Check if avatar exists
    for ext in ('jpg', 'jpeg', 'png', 'gif'):
        path = BACKGROUND_PATH / f'{user_id}.{ext}'
        if path.exists():
            return await send_file(path)

    return b'{"status":404}'
