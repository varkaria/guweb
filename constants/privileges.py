from __future__ import annotations

from enum import IntEnum
from enum import IntFlag
from enum import unique

__all__ = ("Privileges")


@unique
class Privileges(IntFlag):
    """Server side user privileges."""

    # privileges intended for all normal players.
    legit = 1 << 0  # is an unbanned player.
    active = 1 << 1  # has logged in to the server in-game.

    # has bypass to low-ceiling anticheat measures (trusted).
    whitelisted = 1 << 2

    # donation tiers, receives some extra benefits.
    supporter = 1 << 4
    premium = 1 << 5

    # notable users, receives some extra benefits.
    alumni = 1 << 7

    # staff permissions, able to manage server app.state.
    tourment_manager = 1 << 10  # able to manage match state without host.
    BN = 1 << 11  # able to manage maps ranked status.
    manager = 1 << 12  # able to manage users (level 1).
    administrator = 1 << 13  # able to manage users (level 2).
    developer = 1 << 14  # able to manage full server app.state.

    DONATOR = supporter | premium
    STAFF = manager | administrator | developer
