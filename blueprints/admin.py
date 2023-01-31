# -*- coding: utf-8 -*-

__all__ = ()

import bcrypt
import hashlib
from functools import wraps
import hashlib
from quart import Blueprint
from quart import render_template
from quart import session
from quart import request
from quart import redirect
from objects import glob
from constants.privileges import Privileges
from objects.utils import flash
from objects import varka
from objects.glob import t
from osrparse import Replay
import datetime
import timeago


admin = Blueprint("admin", __name__)


def dict_cmp(a: dict, b: dict):
    cmp = a.items() - b.items()
    return dict(cmp)


async def get(table_name: str, id: str):
    data = await varka.get_data(table_name, id)
    return data


def priv_check(priv: Privileges):
    def decorate(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not "authenticated" in session:
                return await flash("error", t("admin.please-login-in-first"), "login")
            if not session["user_data"]["priv"] & priv:
                return await flash(
                    "error", t("admin.you-have-sufficient-privileges"), "home"
                )
            return await func(*args, **kwargs)

        return wrapper

    return decorate


@admin.route("/")
@admin.route("/home")
@admin.route("/dashboard")
@priv_check(priv=Privileges.Staff)
async def home():
    # fetch data from database
    dash_data = await glob.db.fetch(
        "SELECT COUNT(id) count, "
        "(SELECT name FROM users ORDER BY id DESC LIMIT 1) lastest_user, "
        "(SELECT COUNT(id) FROM users WHERE NOT priv & 1) banned "
        "FROM users"
    )

    recent_users = await glob.db.fetchall(
        "SELECT * FROM users ORDER BY id DESC LIMIT 5"
    )
    recent_scores = await glob.db.fetchall(
        "SELECT scores.*, maps.artist, maps.title, "
        "maps.set_id, maps.creator, maps.version "
        "FROM scores JOIN maps ON scores.map_md5 = maps.md5 "
        "ORDER BY scores.id DESC LIMIT 5"
    )

    return await render_template(
        "admin/home.html",
        dashdata=dash_data,
        recentusers=recent_users,
        recentscores=recent_scores,
        datetime=datetime,
        timeago=timeago,
    )


@admin.route("/restrictions", methods=["GET", "POST"])
@priv_check(priv=Privileges.Staff)
async def restrictions():
    return await render_template(
        "/admin/restrictions.html", query_data=await varka.get_res_users()
    )


@admin.route("/users", methods=["GET"])
@priv_check(priv=Privileges.Staff)
async def users():
    query_data = await varka.get_users()
    return await render_template("/admin/users/index.html", query_data=query_data)


@admin.route("/users/search/<q>", methods=["GET"])
@priv_check(priv=Privileges.Staff)
async def users_search(q: str):
    query_data = await varka.get_users(search=q)
    return await render_template(
        "/admin/users/index.html", query_data=query_data, search_value=q
    )


@admin.route("/user/<id>/edit")
@priv_check(priv=Privileges.Staff)
async def users_edit(id: int):
    query = await varka.get_user(id)
    return await render_template("admin/users/edit.html", search_data=query)


@admin.route("/user/<id>/update", methods=["POST"])  # POST
@priv_check(priv=Privileges.Staff)
async def users_update(id: int):
    try:
        form = await request.form
        datadef: dict = await get("users", id)
        data = dict(
            name=form["edit-username"],
            safe_name=form["edit-username"].lower().replace(" ", "_"),
            email=form["edit-email"],
            country=form["edit-country"],
        )
        if form["legality"] == "restricted":
            data["priv"] = 2
        elif datadef["priv"] == 2 and form["legality"] == "unrestricted":
            data["priv"] = 3
        if form["password"] != "":
            pw_md5 = hashlib.md5(form["password"].encode()).hexdigest().encode()
            pw_bcrypt = bcrypt.hashpw(pw_md5, bcrypt.gensalt())
            await glob.db.execute(
                "UPDATE users " "SET pw_bcrypt = %s " "WHERE id = %s", [pw_bcrypt, id]
            )
        await varka.update("users", ("id", id), **dict_cmp(data, datadef))
        return redirect(f"/admin/users/search/{id}")
    except:
        return redirect("/admin/users")


@admin.route("/beatmaps")
@priv_check(priv=Privileges.Nominator | Privileges.Dangerous)
async def beatmaps():
    query = await glob.db.fetch(
        "SELECT (SELECT COUNT(id) as `r` FROM maps WHERE `status`= 2) AS `r`, "
        "(SELECT COUNT(id) as `l` FROM maps WHERE `status`= 5) AS `l`, "
        "(SELECT COUNT(id) as `p` FROM maps WHERE `status`= 0) AS `p`, "
        "(SELECT COUNT(id) as `t` FROM maps) `t`"
    )
    counts = {
        "ranked": query["r"],
        "loved": query["l"],
        "pending": query["p"],
        "total": query["t"],
    }
    # This thing needs to be moved to API
    beatmaps = await glob.db.fetchall(
        "SELECT set_id, id AS `map_id`, status, "
        "artist, title, version AS `diff_name`, "
        "total_length AS length, creator, mode, "
        "cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` "
        "FROM maps ORDER BY id DESC "
        "LIMIT 50"
    )
    return await render_template(
        "admin/beatmaps.html", counts=counts, bmap_query=beatmaps
    )


@admin.route("/beatmaps/search/<q>")
@priv_check(priv=Privileges.Nominator | Privileges.Dangerous)
async def beatmaps_search(q: str):
    query = await glob.db.fetch(
        "SELECT (SELECT COUNT(id) as `r` FROM maps WHERE `status`= 2) AS `r`, "
        "(SELECT COUNT(id) as `l` FROM maps WHERE `status`= 5) AS `l`, "
        "(SELECT COUNT(id) as `p` FROM maps WHERE `status`= 0) AS `p`, "
        "(SELECT COUNT(id) as `t` FROM maps) `t`"
    )
    counts = {
        "ranked": query["r"],
        "loved": query["l"],
        "pending": query["p"],
        "total": query["t"],
    }
    numq = int(q) if q.isdigit() else 0
    beatmaps = await glob.db.fetchall(
        "SELECT set_id, id AS `map_id`, status, "
        "artist, title, version AS `diff_name`, "
        "total_length AS length, creator, mode, "
        "cs, od, ar, hp, bpm, ROUND(diff, 2) AS `stars` "
        "FROM maps WHERE id=%s OR set_id=%s OR title like %s ORDER BY id DESC "
        "LIMIT 50 OFFSET 0",
        [numq, numq, q + "%"],
    )
    return await render_template(
        "admin/beatmaps.html", counts=counts, bmap_query=beatmaps, search_word=q
    )


@admin.route("/beatmaps/edit/<id>")
@priv_check(priv=Privileges.Nominator | Privileges.Dangerous)
async def beatmaps_edit(id: int):
    status = request.args.get("status", type=int)
    is_set = request.args.get("set", type=int) == 1
    if is_set:
        await glob.db.execute(
            "UPDATE maps SET frozen=1, status=%s WHERE set_id=%s",
            [str(status), str(id)],
        )
    else:
        await glob.db.execute(
            "UPDATE maps SET frozen=1, status=%s WHERE id=%s", [str(status), str(id)]
        )
    return redirect("/admin/beatmaps/search/" + id)


@admin.route("/replays/parse", methods=["POST"])
async def replays_parse():
    file = (await request.files)["replay_file"]
    if file is None:
        return {"status": 300, "msg": "Replay is not exists in multipart."}
    try:
        replay = Replay.from_file(file)
        timestamp = replay.timestamp.timestamp()
    except:
        return {"status": 400, "msg": "Failed to parse the replay file."}
    return {
        "status": 200,
        "replay": {
            "map_md5": replay.beatmap_hash,
            "score": replay.score,
            "max_combo": replay.max_combo,
            "mods": replay.mods.value,
            "n300": replay.count_300,
            "n100": replay.count_100,
            "n50": replay.count_50,
            "nmiss": replay.count_miss,
            "ngeki": replay.count_geki,
            "nkatu": replay.count_katu,
            "mode": replay.mode.value,
            "playtime": int(timestamp),
            "replay_id": replay.replay_id,
            "perfect": replay.perfect,
            "username": replay.username,
        },
    }
