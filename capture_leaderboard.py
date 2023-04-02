"""

Cronjob script to capture leaderboard every 24 hours at 03 AM of server time.

Cron settings - 0 */3 * * *

"""

import asyncio

import redis
import time

from cmyui.mysql import AsyncSQLPool

from objects import glob


async def main():
    redis_server = redis.StrictRedis()
    capture_time = round(time.time())
    for leaderboard in redis_server.scan_iter("bancho:leaderboard:[0-9]"):
        mode = leaderboard.decode().split(':')[-1]

        leaderboard_values = redis_server.zrange(leaderboard.decode(), 0, -1, withscores=True)
        leaderboard_values = sorted(
            leaderboard_values,
            key=lambda _: _[1],
            reverse=True
        )

        values = ', '.join([
            f'({player[0].decode()}, {mode}, {rank + 1}, {capture_time})'
            for rank, player in enumerate(leaderboard_values)
        ])

        connection = AsyncSQLPool()
        await connection.connect(glob.config.mysql)
        await connection.execute(
            'INSERT INTO leaderboard_history '
            '(uid, mode, player_rank, capture_time) VALUES '
            f'{values}'
        )

asyncio.run(main())
