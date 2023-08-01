
/**
 * @name jxr
 * @version 1.5.13
 * @author Natnael Eshetu
 * @abstract Replaces script elements of type "text/jxr" 
 *           with the formatted html. 
 * @summary
 *  {...} -- }{ cannot exist inside {} unless it is in string quotes
 *  or escaped with \.
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
        var_exists: function(root_id, id)
        {
            if(!id || id == '')
                return false;
            if(!!root_id)
                root_id = root_id.trim();
            const di = id.indexOf('.');
            if(di != -1)
            {
                const cid = id.substring(0, di);
                const lid = id.substring(di + 1);
                const tid = !!root_id && root_id != '' 
                    ? (root_id+'.'+cid)
                    : cid;
                return eval('typeof '+tid+' !== "undefined"')
                    && jxr.vars.var_exists(tid, lid);
            }
            else
            {
                const tid = !!root_id && root_id != '' 
                    ? (root_id+'.'+id)
                    : id;
                return eval('typeof '+tid+' !== "undefined"');
            }
            return false;
        },
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
    process: function(__script, __shtml, __script_src_, __script_id_)
    {
        let __skip_indices = [];
        let __html         = null;
        let __script_id    = '';
        let __script_src   = '';
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
            const jxr_error = function(err, __shtml, __offset, __script_id, __log_line_numbered_code)
            {
                const script_substr = __shtml.substring(Math.max(__offset-1, 0), Math.min(__offset+17, __shtml.length));
                const line = (__shtml.substring(0, __offset+1).match(/\n/g) || []).length+1;
                const offs = __offset - __shtml.lastIndexOf("\n", __offset);
                if(__log_line_numbered_code)
                {
                    let l = 1;
                    const maxpad = 3;
                    schtml = ' '.repeat(maxpad-1)+'1:'+__shtml;
                    console.error(schtml.replaceAll("\n", function(match)
                    {
                        const lstr = ''+(++l);
                        const pad  = ' '.repeat(maxpad-lstr.length);
                        return "\n"+pad+lstr+':';
                    }));
                }
                return EvalError(err+' @'+__script_id+':'+line+':'+offs+' -- `'+script_substr+'`');
            };
            let __skip_start_i  = null;
            let __last_i        = 0;
            let __res_i         = 0;
            let __log_line_numbered_code = false;
            if(!!__script)
            {
                if(__script instanceof HTMLScriptElement)
                {
                    const attr_id   = __script.getAttribute('id') || __script_id_;
                    const attr_src  = __script.getAttribute('src') || __script_src_;
                    if(!!attr_id)
                        __script_id =  attr_id;
                    else if(!!attr_src)
                    {
                        __script_id =  attr_src;
                        __script_src = attr_src;
                    }
                    __log_line_numbered_code = !attr_src;
                }
                else if(__script instanceof Object)
                {
                    __script_id = __script.script_id+'/'+__script.type+' `'+__script.name+'`';
                    __log_line_numbered_code = true;
                }
            }
            // remove comments
            __shtml = __shtml.replaceAll(/\{\*(\\[}{]|.)*?\*\}/gs, '');
            // process and remove __macro definitions
            __shtml = __shtml.replaceAll(/\{#\s*(\w+)\s*\(\s*((?:(?:\w+)\s*,?\s*)*)\s*\)\s*\n?(.*?)\n?\s*#\}/gs, function(__match, __p1, __p2, __p3, __offset)
            {
                const __name   = __p1;
                if(typeof jxr.macros[__name] !== 'undefined')
                    throw jxr_error('Macro previously defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                const __params = __p2.split(/\s*,\s*/gs);
                const __body   = __p3.replaceAll(/\{\s*(?:(\w+)|#(\w+))?\s*\}/gs, function(__match, __p1, __p2)
                {
                    let pi = -1;
                    if(!!__p1 && (pi = __params.indexOf(__p1)) != -1)
                    {
                        return '{#'+__p1+'}';
                    }
                    else if(!!__p2 && (pi = __params.indexOf(__p2)) != -1)
                    {
                        return '{~'+__p2+'}';
                    }
                    return __match;
                });
                jxr.macros[__name] = {
                    type:       '__macro',
                    script_id:  __script_id,
                    script_src: __script_src,
                    name:       __name,
                    params:     __params,
                    body:       __body
                };
                return '';
            });
            __html  = __shtml.replaceAll(/\{\s*((?:\\[}{]|.)*?)\}/gs, function(__match, __p1, __offset)
            {
                const validate_value_vars = function(__value)
                {
                    if(!__value)
                        return '';
                    if(__value.search(/^\s*\\[}{}]/gs) != -1)
                    {
                        let rvalue = __value.replaceAll(/\\([}{}])/gs, '$1');
                        return rvalue.trim();
                    }
                    else
                    {
                        let rvalue = __value.replaceAll(/(?:(['"])(?:\\\1|.)*\1|(true|false|null|undefined|\d+)|([a-zA-Z_][\w\.]*))/gs, function(__match, __p1, __p2, __p3)
                        {
                            if(!!__p1 || !!__p2)
                                return __match;
                            else if(__match == 'null' || __match == 'undefined')
                                return __match;
                            else
                            {
                                const robj = __p3.substring(0, __p3.indexOf('.'));
                                if(jxr.vars.var_exists('jxr.vars', __p3))
                                    return ('jxr.vars.'+__p3);
                                else if(jxr.vars.var_exists(null, __p3))
                                    return (__p3);
                                else
                                    throw jxr_error('variable `'+__p3+'` is not defined.', __shtml, __offset, __script_id, __log_line_numbered_code);
                            }
                        });
                        return rvalue;
                    }
                };
                __res_i       += __offset - __last_i;
                __last_i       = __offset + __match.length;
                let   __result = '';
                const __expr   = __p1;
                const rstrmap  = {
                    '|nl':   "\n",
                    '|tab':  "\t",
                    '|c':    ":",
                    '|bo':    "{",
                    '|bc':    "}",
                    'b/':    "{",
                    '/b':    "}",
                };
                if(!__expr || __expr == '')
                {
                }
                else if(rstrmap.hasOwnProperty(__expr))
                {
                    __result = rstrmap[__expr];
                }
                else if(__expr == 'skip/')
                {
                    __skip_start_i = __res_i;
                }
                else if(__expr == '/skip')
                {
                    if(__skip_start_i != null)
                    {
                        const skip_end_i = __res_i;
                        __skip_indices.push({
                            start:  __skip_start_i, 
                            end:    skip_end_i,
                        });
                        __skip_start_i = null;
                    }
                }
                else if(__expr.search(/^for\s+.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{])/gs, '$1');
                    const __matches = /for (\w+)\s+in\s+(.*?)\s*\:\s*?\n?(.+?\n?)\s*$/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 3)
                    {
                        const iname   = __matches[1];
                        const ivar    = eval(validate_value_vars(__matches[2]));
                        const icode   = __matches[3];
                        const itmp    = jxr.vars[iname];
                        let cresult = '';
                        if(!ivar)
                            throw jxr_error('invalid for loop iterable variable!', __shtml, __offset, __script_id, __log_line_numbered_code);
                        if(ivar instanceof Object
                        && typeof ivar.start != 'undefined' 
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
                                    __script_id: __script_id,
                                    __script_src: __script_src,
                                    __name: 'for',
                                    __body: __rexpr,
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
                                    __script_id: __script_id,
                                    __script_src: __script_src,
                                    __name: 'for',
                                    __body: __rexpr,
                                }, icode);
                                cresult += result;
                            }
                        }
                        if(itmp !== undefined)
                            jxr.vars[iname] = itmp;
                        __result = cresult;
                    }
                    else 
                        throw jxr_error('invalid for loop __code!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else if(__expr.search(/^if\s+.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{])/gs, '$1');
                    const __matches = /(?:(?:if|\:elseif)\s+(.*?)\s*\:(.*?))+(?:\:\s*else\s*\:(.*?))?/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 1)
                    {
                        try  {
                            const if_cond = {
                                type: 'if-condition',
                                __script_id: __script_id,
                                __script_src: __script_src,
                                __name: 'if',
                                __body: __rexpr,
                            };
                            let if_state = 0;
                            const result = __rexpr.replaceAll(/(?:(?:(elseif|if)\s+)(.*?)\:\s*\n?(.+?\n?)\s*(\:|$)|(else)\s*\:\s*\n?(.+?\n?)\s*$)/gs, function(__match, ...args)
                            {
                                if(if_state == 0) // if
                                {
                                    const condition = args[1];
                                    const __code      = args[2];
                                    const condval   = eval(validate_value_vars(condition));
                                    if(condval)
                                    {
                                        __result = jxr.process(if_cond, __code);
                                        throw 0;
                                    }
                                    if_state = 1;
                                }
                                else if(if_state == 1 || if_state == 2) // else-if or else
                                {
                                    if(args[0] == 'elseif')
                                    {
                                        const condition = args[1];
                                        const __code      = args[2];
                                        const condval   = eval(validate_value_vars(condition));
                                        if(condval)
                                        {
                                            __result = jxr.process(if_cond, __code);
                                            throw 0;
                                        }
                                        if_state = 2;
                                    }
                                    else if(args[4] == 'else')
                                    {
                                        const __code = args[5];
                                        __result = jxr.process(if_cond, __code);
                                        if_state = 3;
                                        throw 0;
                                    }
                                    else
                                        throw jxr_error('expecting `elseif` or `else`!', __shtml, __offset, args[args.length-2], __log_line_numbered_code);
                                }
                                else
                                {
                                    throw jxr_error('expecting end of block!', __shtml, __offset, args[args.length-2], __log_line_numbered_code);
                                }
                                return '';
                            });
                        }
                        catch(e)
                        {
                            if(typeof(e) != 'number')
                                throw e;
                        }
                    }
                    else 
                        throw jxr_error('invalid if-condition __code!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else if(__expr.search(/^#\s*\w+\s*\(\s*.*?\s*\)\s*/gs) != -1)
                {
                    const __matches = /\s*(\w+)\s*\(\s*(.*?)\s*\)\s*/gs.exec(__expr);
                    const __name    = __matches[1];
                    const __params  = __matches[2].split(/\s*,\s*/gs);
                    if(typeof jxr.macros[__name] === 'undefined')
                        throw jxr_error('Macro not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                    else
                    {
                        const __macro  = jxr.macros[__name];
                        if(__params.length !== __macro.params.length)
                            throw jxr_error('Macro params mismatch!', __shtml, __offset, __script_id, __log_line_numbered_code);
                        const __body   = __macro.body.replaceAll(/\{(?:#(\w+)|~(\w+))\}/gs, function(__match, __p1, __p2)
                        {
                            if(!!__p2)
                            {
                                const pi     = __macro.params.indexOf(__p2);
                                const pname  = __params[pi];
                                return pname;
                            }
                            else
                            {
                                const pi   = __macro.params.indexOf(__p1);
                                const pvar = '{'+__params[pi]+'}';
                                return pvar;
                            }
                        });
                        __result  = jxr.process(__macro, __body, __script_src, __script_id);
                    }
                }
                else if(__expr.search(/^\!.*$/gs) != -1)
                {
                    const __r = /^\!(.*)$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __code   = __spexpr[1].replaceAll(/\\([}{])/gs, '$1');
                    eval(__code);
                }
                else if(__expr.search(/^\^.*$/gs) != -1)
                {
                    const __r = /^\^(.*)$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __code   = __spexpr[1].replaceAll(/\\([}{])/gs, '$1');
                    __result = strvar(eval(__code));
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*=\s*.+\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*=\s*(.+)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __spexpr[1];
                    const __value  = __spexpr[2];
                    let   __cvalue = validate_value_vars(__value);
                    if(__cvalue.search(/\s*\{.*\}\s*/gs) != -1)
                    {
                        __cvalue = __cvalue.replaceAll(/(?:(?:".*?")|(\w+))/gs, function(__match, __p1)
                        {
                            if(!!__p1 && __p1 != '')
                            {
                                const __name = __p1;
                                if(jxr.vars.var_exists('jxr.vars', __name))
                                    return jstrvar(eval('jxr.vars.'+__name));
                                else if(jxr.vars.var_exists(null, __name))
                                    return jstrvar(eval(__name));
                                else
                                    throw jxr_error('variable `'+__name+'` not defined.', __shtml, __offset, __script_id, __log_line_numbered_code);
                            }
                            else
                                return __match;
                        });
                        const __assign_code = 'jxr.vars.'+__name+' = JSON.parse(__cvalue)';
                        eval(__assign_code);
                    }
                    else
                    {
                        const __assign_code = 'jxr.vars.'+__name+' = eval(__cvalue)';
                        eval(__assign_code);
                    }
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*\?\s*.*\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*\?\s*(.*)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __spexpr[1];
                    const dvalue = __spexpr[2];
                    if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = strvar(eval('jxr.vars.'+__name));
                    else if(jxr.vars.var_exists(null, __name))
                        __result = strvar(eval(__name));
                    else
                    {
                        if(dvalue == '')
                            __result = 'undefined';
                        else
                        {
                            const __cvalue      = validate_value_vars(dvalue);
                            const __assign_code = 'jxr.vars.'+__name+' = '+__cvalue;
                            __result = strvar(eval(__assign_code));
                        }
                    }
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*\:\s*.*\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*\:\s*(.*)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __spexpr[1];
                    const __dvalue = __spexpr[2];
                    if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = strvar(eval('jxr.vars.'+__name));
                    else if(jxr.vars.var_exists(null, __name))
                        __result = strvar(eval(__name));
                    else
                    {
                        if(__dvalue == '')
                            __result = 'undefined';
                        else
                        {
                            const __cvalue = validate_value_vars(__dvalue);
                            __result = strvar(eval(__cvalue));
                        }
                    }
                }
                else if(__expr.search(/^\s*([a-zA-Z_][\w\.]*)\s*$/g) != -1)
                {
                    const __name = __expr;
                    if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = strvar(eval('jxr.vars.'+__name));
                    else if(jxr.vars.var_exists(null, __name))
                        __result = strvar(eval(__name));
                    else 
                        throw jxr_error('variable `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else
                {
                    let __rexpr = __expr.replaceAll(/([a-zA-Z_][\w\.]*)/g, function(__match, __p1)
                    {
                        const __name = __p1;
                        if(jxr.vars.var_exists('jxr.vars', __name))
                            return 'jxr.vars.'+__name;
                        else if(jxr.vars.var_exists(null, __name))
                            return __name;
                        else 
                            throw jxr_error('variable `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                    });
                    __result = strvar(eval(__rexpr));
                }
                __res_i += __result.length;
                return __result;
            });
        }
        // remove skip blocks
        let thtml  = '';
        {
            const is_space = function(ch) { return (ch == ' ' || ch == "\t" || ch == "\v" || ch == "\__r"); };
            let __last_i = 0;
            for(let skip_index of __skip_indices)
            {
                let start_i = skip_index.start;
                let end_i   = skip_index.end;
                for(start_i--; start_i > __last_i; start_i--)
                {
                    const ch = __html.charAt(start_i);
                    if(ch == "\n" || !is_space(ch))
                    {
                        start_i++;
                        break;
                    }
                }
                for(; end_i < __html.length; end_i++)
                {
                    const ch = __html.charAt(end_i);
                    if(ch == "\n" || !is_space(ch))
                        break;
                }
                thtml  += __html.substring(__last_i, start_i);
                __last_i  = end_i + 1;
            }
            if(__last_i < __html.length)
            {
                thtml += __html.substring(__last_i);
            }
        }
        // replace the __script tag with the processed output
        if(typeof __script == 'string')
        {
            return thtml;
        }
        else if(__script instanceof HTMLScriptElement)
        {
            let e =  null;
            const __r = /^\s*<([a-zA-Z]+)(.*?)>(.*)<\/\1>\s*$/gs;
            rxhtml  = __r.exec(thtml);
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
                if(!!__script_id && __script_id != '')
                    e.setAttribute('id', __script_id);
                e.innerHTML = thtml;
            }
            __script.replaceWith(e);
        }
        else if(__script instanceof Object) // __macro
        {
            return thtml;
        }
        return thtml;
    },
    update: function(script)
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
    },
    update_all: function(target)
    {
        target = !!target ? target : document;
        let scripts = target.querySelectorAll('script[type="text/jxr"]');
        for(let script of scripts)
        {
            jxr.update(script);
        }
    },
    observer: null,
    observe: function()
    {
        if(!jxr.observer)
        {
            const config = { 
                childList: true, 
                subtree: true 
            };
            const callback = function(mutation_list, observer) 
            {
                for(const mutation of mutation_list) 
                {
                    if(mutation.target.tagName == 'SCRIPT'
                    && mutation.target.getAttribute('type') == 'text/jxr')
                    {
                        observer.jxr.update(mutation.target);
                    }
                    else
                    {
                        let jxr_scripts = mutation.target.querySelectorAll('script[type="text/jxr"]');
                        if(jxr_scripts && jxr_scripts.length > 0)
                        {
                            for(let jxr_script of jxr_scripts)
                                observer.jxr.update(jxr_script);
                        }
                    }
                }
            };
            jxr.observer     = new MutationObserver(callback);
            jxr.observer.jxr = jxr;
            jxr.observer.observe(document, config);
        }
    },
    stop: function()
    {
        if(!!jxr.observer)
        {
            jxr.observer.disconnect();
            jxr.observer = null;
        }
    }
};

document.addEventListener('DOMContentLoaded', function(){ jxr.update_all(); });
