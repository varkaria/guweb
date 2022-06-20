
#把locale传入i18n方法当中用于识别locale
#不能放入main.py当中,会产生循环导入
#(待翻译成en)

from quart import Blueprint, Quart, session

import i18n

app = Quart(__name__)

@app.template_global()
def t(key, **kwargs) -> str:
    kwargs['locale'] = session.get('lang', 'zh_CN')
    try:
        return i18n.t(key, **kwargs)
    except:
        return key