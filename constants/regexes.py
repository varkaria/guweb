# -*- coding: utf-8 -*-

import re

username = re.compile(r'^[\w \[\]-]{2,15}$')
email = re.compile(r'^[^@\s]{1,200}@[^@\s\.]{1,30}\.[^@\.\s]{1,24}$')
key = re.compile(r"[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}\Z")
