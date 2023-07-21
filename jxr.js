
/**
 * @name jxr
 * @version 1.0.0
 * @author Natnael Eshetu
 * @abstract Replaces script elements of type "text/jxr" 
 *           with the formatted html. 
 * @summary
 *  {...} -- }{ cannot exist inside {} unless it is in 
 *           string quotes or escaped with \.
 * 
 * @example
 * 
 *  <script src="jxr.js"></script>
 *  <script type="text/jxr" src="hello.jxr">
 *  <script type="text/jxr">
 *      {skip/}
 *          {a=1}{b=2}{c=a+b}{c}
 *          {d?'default-set'}
 *          {e:'default-dontset'}
 *          {document.title = 'hello'}
 *          {^document.title = 'hello'}
 *          {ext = \{ 
 *              "stype": "json", 
 *              "version": "1.0.0" 
 *              "valid": true, 
 *          \}}
 *          {data = [1,2,3,4]}
 *      {/skip}
 *          {!console.log('hello')}
 *          {document.title}
 *          {^document.title}
 *      <div>hello {name:'stranger'}</div>
 *  </script>
 * 
 */

let jxr = {
    vars: {},
    process: function(script, shtml)
    {
        let skip_indices = [];
        let html = null;
        {
            const strvar = function(var_)
            {
                if(var_ instanceof Object || var_ instanceof Array)
                    return JSON.stringify(var_);
                return ''+var_;
            };
            const jstrvar = function(var_)
            {
                if(typeof var_ == 'string')
                    return '"'+var_+'"';
                else if(var_ instanceof Object || var_ instanceof Array)
                    return JSON.stringify(var_);
                return ''+var_;
            };
            const jxr_error = function(err, shtml, offset, script_name, log_line_numbered_code)
            {
                const script_substr = shtml.substring(Math.max(offset-1, 0), Math.min(offset+name.length+3, shtml.length));
                const line = (shtml.substring(0, offset+1).match(/\n/g) || []).length+1;
                const offs = offset - shtml.lastIndexOf("\n", offset);
                if(log_line_numbered_code)
                {
                    let l = 1;
                    const maxpad = 3;
                    schtml = ' '.repeat(maxpad-1)+'1:'+shtml;
                    console.error(schtml.replaceAll("\n", function(match)
                    {
                        const lstr = ''+(++l);
                        const pad  = ' '.repeat(maxpad-lstr.length);
                        return "\n"+pad+lstr+':';
                    }));
                }
                throw EvalError(err+' @'+script_name+':'+line+':'+offs+' -- `'+script_substr+'`');
            };
            const replace_value_vars = function(value)
            {
                if(value.search(/^\s*\\[}{}]/gs) != -1)
                {
                    let rvalue = value.replaceAll(/\\([}{}])/gs, '$1');
                    return rvalue.trim();
                }
                else
                {
                    let rvalue = value.replaceAll(/\s*((['"])(?:\\\2|.)*?\2|[\w\.]+)\s*/gs, function(match_, p1, p2)
                    {
                        if(!p1 || p2 == '\'' || p2 == '"')
                            return match_;
                        else if(match_ == 'null' || match_ == 'undefined')
                            return match_;
                        else if(p1.indexOf('.') != -1)
                        {
                            return eval(match_);
                        }
                        else
                        {
                            if(jxr.vars.hasOwnProperty(p1))
                                return 'jxr.vars.'+p1;
                            else if(eval('!!'+p1))
                                return p1;
                            else
                                throw EvalError('variable `'+p1+'` is not defined.');
                        }
                    });
                    return rvalue;
                }
            };
            let skip_start_i = null;
            let last_i       = 0;
            let res_i        = 0;
            shtml = shtml.replaceAll(/\{\*(\\[}{]|.)*?\*\}/gs, '');
            html  = shtml.replaceAll(/\{\s*((?:\\[}{]|.)*?)\s*\}/gs, function(match_, p1, offset)
            {
                res_i  += offset - last_i;
                last_i  = offset + match_.length;
                let res = '';
                const expr = p1;
                if(!expr || expr == '')
                {
                }
                else if(expr == 'b/')
                {
                    res = '{';
                }
                else if(expr == '/b')
                {
                    res = '}';
                }
                else if(expr == 'skip/')
                {
                    skip_start_i = res_i;
                }
                else if(expr == '/skip')
                {
                    if(skip_start_i != null)
                    {
                        const skip_end_i = res_i;
                        skip_indices.push({
                            start:  skip_start_i, 
                            end:    skip_end_i,
                        });
                        skip_start_i = null;
                    }
                }
                else if(expr.search(/^\!.*$/gs) != -1)
                {
                    const r = /^\!(.*)$/gs;
                    const spexpr = r.exec(expr);
                    const code   = spexpr[1];
                    eval(code);
                }
                else if(expr.search(/^\^.*$/gs) != -1)
                {
                    const r = /^\^(.*)$/gs;
                    const spexpr = r.exec(expr);
                    const code   = spexpr[1];
                    res = strvar(eval(code));
                }
                else if(expr.search(/^\s*[\w\.]+\s*=\s*.+\s*$/gs) != -1)
                {
                    const r = /^\s*([\w\.]+)\s*=\s*(.+)\s*$/gs;
                    const spexpr = r.exec(expr);
                    const name   = spexpr[1];
                    const value  = spexpr[2];
                    let   cvalue = replace_value_vars(value);
                    if(cvalue.search(/\s*\{.*\}\s*/gs) != -1)
                    {
                        cvalue = cvalue.replaceAll(/(?:(?:".*?")|(\w+))/gs, function(match_, p1)
                        {
                            if(!!p1 && p1 != '')
                            {
                                if(jxr.vars.hasOwnProperty(p1))
                                    return jstrvar(eval('jxr.vars.'+p1));
                                else if(eval('typeof '+p1+' !== \'undefined\''))
                                    return jstrvar(eval(p1));
                                else
                                    throw EvalError('variable `'+p1+'` is not defined.');
                            }
                            else
                                return match_;
                        });
                        jxr.vars[name] = JSON.parse(cvalue);
                    }
                    else
                        jxr.vars[name] = eval(cvalue);
                }
                else if(expr.search(/^\s*[\w\.]+\s*\?\s*.*\s*$/gs) != -1)
                {
                    const r = /^\s*([\w\.]+)\s*\?\s*(.*)\s*$/gs;
                    const spexpr = r.exec(expr);
                    const name   = spexpr[1];
                    const dvalue = spexpr[2];
                    if(!jxr.vars.hasOwnProperty(name))
                    {
                        if(dvalue == '')
                        {
                            res = 'undefined';
                        }
                        else
                        {
                            const cvalue   = replace_value_vars(dvalue);
                            jxr.vars[name] = eval(cvalue);
                            res = strvar(jxr.vars[name]);
                        }
                    }
                    else 
                        res = strvar(jxr.vars[name]);
                }
                else if(expr.search(/^\s*[\w\.]+\s*\:\s*.*\s*$/gs) != -1)
                {
                    const r = /^\s*([\w\.]+)\s*\:\s*(.*)\s*$/gs;
                    const spexpr = r.exec(expr);
                    const name   = spexpr[1];
                    const dvalue = spexpr[2];
                    if(!jxr.vars.hasOwnProperty(name))
                    {
                        if(dvalue == '')
                        {
                            res = 'undefined';
                        }
                        else
                        {
                            const cvalue = replace_value_vars(dvalue);
                            res = eval(cvalue);
                        }
                    }
                    else 
                        res = strvar(jxr.vars[name]);
                }
                else if(expr.search(/^\s*([\w\.]+)\s*$/g) != -1)
                {
                    const name = expr.trim();
                    if(name.indexOf('.') != -1)
                    {
                        let ids  = name.split('.');
                        let rvar = ids[0];
                        if(jxr.vars.hasOwnProperty(rvar))
                            rvar = 'jxr.vars.'+rvar;
                        else if(eval('typeof '+rvar+' !== \'undefined\''))
                            rvar = rvar;
                        else 
                        {
                            const script_name = !!script.getAttribute('name') ? script.getAttribute('name') : (!!script.getAttribute('src') ? script.getAttribute('src') : '');
                            throw jxr_error('variable `'+name+'` is not defined!', shtml, offset, script_name, !script.getAttribute('src'));
                        }
                        for(let i = 1; i < ids.length; i++)
                        {
                            rvar += '.'+ids[i];
                        }
                        res = strvar(eval(rvar));
                    }
                    else
                    {
                        if(jxr.vars.hasOwnProperty(name))
                            res = strvar(jxr.vars[name]);
                        else if(eval('typeof '+name+' !== \'undefined\''))
                            res = strvar(eval(name));
                        else 
                        {
                            const script_name = !!script.getAttribute('name') ? script.getAttribute('name') : (!!script.getAttribute('src') ? script.getAttribute('src') : '');
                            throw jxr_error('variable `'+name+'` is not defined!', shtml, offset, script_name, !script.getAttribute('src'));
                        }
                    }
                }
                else
                {
                    let rexpr = expr.replaceAll(/\s*(?:(?=[^\.]\w*)(\w+)|([\w\.]+))\s*/g, function(match_, p1)
                    {
                        if(p1.indexOf('.') != -1)
                        {
                            return match_;
                        }
                        else
                        {
                            if(jxr.vars.hasOwnProperty(p1))
                                return 'jxr.vars.'+p1;
                            else if(eval('typeof '+p1+' !== \'undefined\''))
                                return p1;
                            else
                                throw EvalError('variable `'+p1+'` is not defined.');
                        }
                    });
                    res = strvar(eval(rexpr));
                }
                res_i += res.length;
                return res;
            });
        }
        // remove skip blocks
        let thtml  = '';
        {
            const is_space = function(ch) { return (ch == ' ' || ch == "\t" || ch == "\v" || ch == "\r"); };
            let last_i = 0;
            for(let skip_index of skip_indices)
            {
                let start_i = skip_index.start;
                let end_i   = skip_index.end;
                for(start_i--; start_i > last_i; start_i--)
                {
                    const ch = html.charAt(start_i);
                    if(!is_space(ch))
                        break;
                }
                for(; end_i < html.length; end_i++)
                {
                    const ch = html.charAt(end_i);
                    if(!is_space(ch))
                        break;
                }
                thtml  += html.substring(last_i, start_i);
                last_i  = end_i + 1;
            }
            if(last_i < html.length)
            {
                thtml += html.substring(last_i);
            }
        }
        // replace the script tag with the processed output
        {
            let e =  null;
            const r = RegExp('.*?<([a-zA-Z]+)(.*?)>(.*)<\/\\1.*?>.*?', 'gs');
            rxhtml  = r.exec(thtml);
            if(!!rxhtml && rxhtml.length > 2)
            {
                const tag         = rxhtml[1];
                const tattributes = rxhtml[2];
                const innerHTML   = rxhtml[3];
                e = document.createElement(tag);
                {
                    const attributes = tattributes.matchAll(/\s*([a-zA-Z]+)\s*(?:=\s*(['"].*?['"]|\d+|(?:true|false)))?\s*/g)
                    for(let attribute of attributes)
                    {
                        if(attribute[2] == undefined)
                            e.setAttribute(attribute[1], '');
                        else
                        {
                            let val = attribute[2];
                            if(val.charAt(0) == '\'' || val.charAt(0) == '"')
                                e.setAttribute(attribute[1], val.substring(1, val.length - 1));
                            else
                                e.setAttribute(attribute[1], val);
                        }
                    }
                }
                e.innerHTML = innerHTML;
            }
            else
            {
                e = document.createElement('div');
                for(let attr of script.attributes)
                {
                    e.setAttribute(attr.nodeName, attr.nodeValue);
                }
                e.innerHTML = thtml;
            }
            script.replaceWith(e);
        }
    }
};


document.addEventListener('DOMContentLoaded', function()
{
    let scripts = document.querySelectorAll('script[type="text/jxr"]');
    for(let script of scripts)
    {
        script.removeAttribute('type');
        let script_src = script.getAttribute('src');
        if(!!script_src)
        {
            const async = script.getAttribute('async') != 'false' || script.hasAttribute('async');
            let xhr = new XMLHttpRequest();
            xhr.open("GET", script_src, async);
            xhr.onload = function () 
            {
                if(this.readyState === XMLHttpRequest.DONE && xhr.status === 200) 
                {
                    shtml = this.responseText;
                    script.removeAttribute('src');
                    jxr.process(script, this.responseText);
                }
                else
                    console.error('failed to fetch script `'+script_src+'`');
            };
            xhr.send();
        }
        else
        {
            jxr.process(script, script.innerHTML);
        }
        
    }
});
