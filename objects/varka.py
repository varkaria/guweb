from quart import jsonify
from objects import glob


async def get_users(limit: int = 100, search: str = None):
    """Returns the all of a users."""
    query = """
        select 
            u.*,
            l.ip,
            l.osu_ver,
            l.osu_stream,
            l.datetime as last_login
        from users u
        left join (
            select * from ingame_logins i1
            inner join (
                select max(id) as max_id
                from ingame_logins
                group by userid
            ) as i2
            ON i1.id = i2.max_id
        ) as l
        on u.id = l.userid
    """.replace(
        "  ", " "
    ).splitlines()
    args = []

    if search:
        query.append("WHERE u.`name` LIKE %s")
        args.append(f"{search}%")
        query.append("OR u.`email` LIKE %s")
        args.append(f"{search}%")
        query.append("OR CONVERT(u.`id`, char) LIKE %s")
        args.append(f"{search}%%")

    query.append(f"ORDER BY l.`datetime` DESC LIMIT %s")
    args.append(limit)

    query = " ".join(query)
    res = await glob.db.fetchall(query, args)
    return res


async def get_user(id: int):
    """Returns the all of a users."""
    query = f"SELECT * FROM users WHERE id={id}"
    res = await glob.db.fetch(query)
    return res


async def get_user_username(username: str):
    query = f'SELECT id from users WHERE name="{username}"'
    res = await glob.db.fetch(query)
    return res


async def get_user_email(email: str):
    query = f'SELECT id from users WHERE email="{email}"'
    res = await glob.db.fetch(query)
    return res


async def get_res_users():
    query = "select ru.id, ru.country, ru.name,`logs`.msg, `logs`.time  from (SELECT * FROM `users` where NOT users.priv & 1) ru left join `logs` on ru.id=`logs`.to"
    res = await glob.db.fetchall(query)
    return res


async def get_scores(limit: int = 25):
    """Returns the all of a scores."""
    query = (
        "SELECT scores_vn.*, maps.artist, maps.title, "
        "maps.set_id, maps.creator, maps.version "
        "FROM scores_vn "
        "JOIN maps ON scores_vn.map_md5 = maps.md5 "
        f"ORDER BY scores_vn.id DESC LIMIT {limit}"
    )
    res = await glob.db.fetchall(query)
    return res


async def get_data(table_name: str, id: str):
    if table_name in ("users"):
        if id.isdigit():
            return await glob.db.fetch(
                "select * from `%s` where id = %s limit 1" % (table_name, id)
            )
        else:
            return 404
    else:
        return 404


async def update(table, id, **kargs):
    params = []
    for k, v in kargs.items():
        if v is not None:
            params.append(f"{k}='{v}'")
        else:
            params.append(f"{k}=NULL")
    await glob.db.execute(
        "UPDATE `%s` SET %s WHERE %s = '%s'" % (table, ", ".join(params), *id)
    )
    return "ok"


async def insert(table, **kargs):
    params = []
    for k, v in kargs.items():
        if v is not None:
            params.append(f"{k}='{v}'")
        else:
            params.append(f"{k}=NULL")
    return glob.db.execute("INSERT INTO `%s` SET %s" % (table, ", ".join(params)))


async def search_user(keyword: str):
    if not keyword:
        return b"{}"
    result = await glob.db.fetchall(
        "SELECT id, name "
        "FROM `users` "
        "WHERE priv >= 3 "
        "AND ("
        "   `name` LIKE %s "
        "   OR CONVERT(`id`, char) LIKE %s "
        ") LIMIT 5",
        [keyword + "%%", keyword + "%%"],
    )
    if len(result) == 0:
        return b"{}"
    return jsonify(result)
