
/**
 * @name jxr
 * @version 1.2.5
 * @author Natnael Eshetu
 * @abstract Replaces script elements of type "text/jxr" 
 *           with the formatted html. 
 * @summary
 *  {...} -- }{ cannot exist inside {} unless it is in string quotes.
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
 *      {/skip}
 *          {!console.log('hello')}
 *          {document.title}
 *          {^document.title}
 *      <div>hello {name:'stranger'}</div>
 *  </script>
 * 
 */

let jxr = {
    vars: {
        range: function(count, start, step)
        {
            return { 
                count: !!count ? count : 0, 
                start: !!start ? start : 0, 
                step:  !!step  ? step  : 1, 
            };
        }
    },
    macros: {},
    process: function(script, shtml, script_src_, script_id_)
    {
        let skip_indices = [];
        let html = null;
        let script_id  = '';
        let script_src = '';
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
            const jxr_error = function(err, shtml, offset, script_id, log_line_numbered_code)
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
                return EvalError(err+' @'+script_id+':'+line+':'+offs+' -- `'+script_substr+'`');
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
                    let rvalue = value.replaceAll(/(?:(['"])(?:\\\1|.)*\1|([\w\.]+))/gs, function(match_, p1, p2)
                    {
                        if(!p2 || p2 == '\'' || p2 == '"')
                            return match_;
                        else if(match_ == 'null' || match_ == 'undefined')
                            return match_;
                        else if(p2.indexOf('.') != -1)
                        {
                            return eval(match_);
                        }
                        else
                        {
                            if(jxr.vars.hasOwnProperty(p2))
                                return 'jxr.vars.'+p2;
                            else if(eval('!!'+p2))
                                return p2;
                            else
                                throw EvalError('variable `'+p2+'` is not defined.');
                        }
                    });
                    return rvalue;
                }
            };
            let skip_start_i  = null;
            let last_i        = 0;
            let res_i         = 0;
            let log_line_numbered_code = false;
            if(!!script)
            {
                if(script instanceof HTMLScriptElement)
                {
                    const attr_id   = script.getAttribute('id') || script_id_;
                    const attr_src  = script.getAttribute('src') || script_src_;
                    if(!!attr_id)
                        script_id =  attr_id;
                    else if(!!attr_src)
                    {
                        script_id =  attr_src;
                        script_src = attr_src;
                    }
                    log_line_numbered_code = !attr_src;
                }
                else if(script instanceof Object)
                {
                    script_id = script.script_id+'/'+script.type+' `'+script.name+'`';
                    log_line_numbered_code = true;
                }
            }
            // remove comments
            shtml = shtml.replaceAll(/\{\*(\\[}{]|.)*?\*\}/gs, '');
            // process and remove macro definitions
            shtml = shtml.replaceAll(/\{#\s*(\w+)\s*\(\s*((?:(?:\w+)\s*,?\s*)*)\s*\)(?:\s*\n|\s?)(.*?)(?:\n\s*|\s?)#\}/gs, function(match_, p1, p2, p3, offset)
            {
                const name   = p1;
                if(typeof jxr.macros[name] !== 'undefined')
                    throw jxr_error('Macro previously defined!', shtml, offset, script_id, log_line_numbered_code);
                const params = p2.split(/\s*,\s*/gs);
                const body   = p3.replaceAll(/\{\s*(?:(\w+)|#(\w+))?\s*\}/gs, function(match_, p1, p2)
                {
                    let pi = -1;
                    if(!!p1 && (pi = params.indexOf(p1)) != -1)
                    {
                        return '{#'+p1+'}';
                    }
                    else if(!!p2 && (pi = params.indexOf(p2)) != -1)
                    {
                        return '{~'+p2+'}';
                    }
                    return match_;
                });
                jxr.macros[name] = {
                    type:       'macro',
                    script_id:  script_id,
                    script_src: script_src,
                    name:       name,
                    params:     params,
                    body:       body
                };
                return '';
            });
            html  = shtml.replaceAll(/\{\s*((?:\\[}{]|.)*?)\}/gs, function(match_, p1, offset)
            {
                res_i  += offset - last_i;
                last_i  = offset + match_.length;
                let res = '';
                const expr = p1;
                const rstrmap = {
                    '|nl':   "\n",
                    '|tab':  "\t",
                    'b/':    "{",
                    '/b':    "}",
                };
                if(!expr || expr == '')
                {
                }
                else if(rstrmap.hasOwnProperty(expr))
                {
                    res = rstrmap[expr];
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
                else if(expr.search(/^for\s+.*/gs) != -1)
                {
                    const rexpr   = expr.replaceAll(/\\([}{])/gs, '$1');
                    const matches = /for (\w+)\s+in\s+(.*?)\s*\:(?:\s*\n|\s?)(.*?)(?:\s*\n\s*|\s*)$/gs.exec(rexpr);
                    if(!!matches && matches.length >= 3)
                    {
                        const iname   = matches[1];
                        const ivar    = eval(replace_value_vars(matches[2]));
                        const icode   = matches[3];
                        const itmp    = jxr.vars[iname];
                        let cresult = '';
                        if(!ivar)
                            throw jxr_error('invalid for loop iterable variable!', shtml, offset, script_id, log_line_numbered_code);
                        if(typeof ivar.start != 'undefined' 
                        && typeof ivar.count != 'undefined'
                        && typeof ivar.step != 'undefined'
                        )
                        {
                            const start = ivar.start;
                            const step  = ivar.step;
                            const end   = start + ivar.count * step;
                            for(let i = ivar.start; step > 0 ? (i < end) : (i > end); i += step)
                            {
                                jxr.vars[iname] = i;
                                const result = jxr.process({
                                    type: 'for-loop',
                                    script_id: script_id,
                                    script_src: script_src,
                                    name: 'for',
                                    body: rexpr,
                                }, icode);
                                cresult += result;
                            }
                        }
                        else
                        {
                            for(let it of ivar)
                            {
                                jxr.vars[iname] = it;
                                const result = jxr.process({
                                    type: 'for-loop',
                                    script_id: script_id,
                                    script_src: script_src,
                                    name: 'for',
                                    body: rexpr,
                                }, icode);
                                cresult += result;
                            }
                        }
                        if(itmp !== undefined)
                            jxr.vars[iname] = itmp;
                        res = cresult;
                    }
                    else 
                        throw jxr_error('invalid for loop code!', shtml, offset, script_id, log_line_numbered_code);
                }
                else if(expr.search(/^#\s*\w+\s*\(\s*.*?\s*\)\s*/gs) != -1)
                {
                    const matches = /\s*(\w+)\s*\(\s*(.*?)\s*\)\s*/gs.exec(expr);
                    const name    = matches[1];
                    const params  = matches[2].split(/\s*,\s*/gs);
                    if(typeof jxr.macros[name] === 'undefined')
                        throw jxr_error('Macro not defined!', shtml, offset, script_id, log_line_numbered_code);
                    else
                    {
                        const macro  = jxr.macros[name];
                        if(params.length !== macro.params.length)
                            throw jxr_error('Macro params mismatch!', shtml, offset, script_id, log_line_numbered_code);
                        const body   = macro.body.replaceAll(/\{(?:#(\w+)|~(\w+))\}/gs, function(match_, p1, p2)
                        {
                            if(!!p2)
                            {
                                const pi     = macro.params.indexOf(p2);
                                const pname  = params[pi];
                                return pname;
                            }
                            else
                            {
                                const pi   = macro.params.indexOf(p1);
                                const pvar = '{'+params[pi]+'}';
                                return pvar;
                            }
                        });
                        res  = jxr.process(macro, body, script_src, script_id);
                    }
                }
                else if(expr.search(/^\!.*$/gs) != -1)
                {
                    const r = /^\!(.*)$/gs;
                    const spexpr = r.exec(expr);
                    const code   = spexpr[1].replaceAll(/\\([}{])/gs, '$1');
                    eval(code);
                }
                else if(expr.search(/^\^.*$/gs) != -1)
                {
                    const r = /^\^(.*)$/gs;
                    const spexpr = r.exec(expr);
                    const code   = spexpr[1].replaceAll(/\\([}{])/gs, '$1');
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
                            throw jxr_error('variable `'+name+'` is not defined!', shtml, offset, script_id, log_line_numbered_code);
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
                            throw jxr_error('variable `'+name+'` is not defined!', shtml, offset, script_id, log_line_numbered_code);
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
                                throw jxr_error('variable `'+p1+'` not defined.', shtml, offset, script_id, log_line_numbered_code);
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
        if(typeof script == 'string')
        {
            return thtml;
        }
        else if(script instanceof HTMLScriptElement)
        {
            let e =  null;
            const r = /^\s*<([a-zA-Z]+)(.*?)>(.*)<\/\1>\s*$/gs;
            rxhtml  = r.exec(thtml);
            if(!!rxhtml && rxhtml.length >= 3)
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
                if(!!script_id && script_id != '')
                    e.setAttribute('id', script_id);
                e.innerHTML = thtml;
            }
            script.replaceWith(e);
        }
        else if(script instanceof Object) // macro
        {
            return thtml;
        }
        return thtml;
    }
};


document.addEventListener('DOMContentLoaded', function()
{
    let scripts = document.querySelectorAll('script[type="text/jxr"]');
    for(let script of scripts)
    {
        script.removeAttribute('type');
        const script_id  = script.getAttribute('id');
        const script_src = script.getAttribute('src');
        if(!!script_src)
        {
            const attr_async = script.getAttribute('async');
            const async = !attr_async || attr_async != 'false';
            let xhr = new XMLHttpRequest();
            xhr.data = {
                script:     script,
                script_src: script_src,
                script_id:  script_id,
            };
            xhr.open("GET", script_src, async);
            xhr.onload = function () 
            {
                if(this.readyState === XMLHttpRequest.DONE && this.status === 200) 
                {
                    shtml = this.responseText;
                    script.removeAttribute('src');
                    jxr.process(this.data.script, shtml, this.data.script_src, this.data.script_id_);
                }
                else
                    console.error('failed to fetch script `'+this.data.script_src+'`');
            };
            xhr.send();
        }
        else
        {
            jxr.process(script, script.innerHTML);
        }
        
    }
});
