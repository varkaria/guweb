
#把locale传入i18n方法当中用于识别locale
#不能放入main.py当中,会产生循环导入
#(待翻译成en)

from quart import Quart, session
from objects import glob

import i18n

app = Quart(__name__)

@app.template_global()
def t(key, **kwargs) -> str:
    kwargs['locale'] = session.get('lang', glob.config.default_locale)
    try:
        return i18n.t(key, **kwargs)
    except:
        try:
            return i18n.t(key + '._string', **kwargs)
        except:
            return key
