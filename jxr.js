
/**
 * @name jxr
 * @version 1.11.35
 * @author Natnael Eshetu
 * @abstract Replaces script elements of type "text/jxr" 
 *           with the formatted html.
 */

let jxr = {
    __process_varid: function(var_id)
    {
        var_id = var_id.replaceAll(/\.\s*(\d+)/g, '[$1]');
        return var_id;
    },
    __register_varcode_to_scope: function(var_code)
    {
        let scope_id   = jxr.vars.scope;
        if(typeof jxr.scope_records[scope_id] === 'undefined'
            || !jxr.scope_records[scope_id] instanceof Array)
            jxr.scope_records[scope_id] = [];
        const record_does_not_exist = jxr.scope_records[scope_id].find(function(record)
            { return record.var_code == var_code; }) === undefined;
        if(record_does_not_exist);
            jxr.scope_records[scope_id].push({ 
                var_code: var_code, 
                var_ref: eval(var_code) 
            });
    },
    __get_common_records: function(records, prev_records)
    {
        let common_records = [];
        let lrec = records;
        let grec = prev_records;
        const prev_less = prev_records.length < records.length;
        if(prev_records.length < records.length)
        {
            lrec = prev_records;
            grec = records;
        }
        for(let lrecord of lrec)
        {
            for(let grecord of grec)
            {
                if(lrecord.var_code == grecord.var_code)
                {
                    common_records.push(prev_less ? lrecord : grecord);
                    break;
                }
            }
        }
        return common_records;
    },
    __replace_all_blocks: function(subject, callback, __offset, __subject)
    {
        console.assert(!!subject);
        console.assert(!!callback);
        __offset  = !!__offset  ? __offset : 0;
        __subject = !!__subject ? __subject : subject;
        let   result      = '';
        let   start_i     = 0;
        let   end_i       = 0;
        let   open_braces = 0;
        let   open_quote  = null;
        for(let i = 0; i < subject.length; i++)
        {
            const ch = subject.charAt(i);
            switch(ch)
            {
                case "{":
                    if(open_quote == null)
                    {
                        if(open_braces == 0)
                        {
                            result += subject.substring(start_i, i);
                            start_i = i + 1;
                        }
                        open_braces++;
                    }
                    break;
                case "}":
                    if(open_quote == null)
                    {
                        if(open_braces == 1)
                        {
                            end_i   = i;
                            const block_subject = subject.substring(start_i, end_i);
                            const res = callback(block_subject, __offset + start_i, __subject);
                            result += res;
                            start_i = i + 1;
                        }
                        if(open_braces > 0)
                            open_braces--;
                    }
                    break;
                case "'":
                // case '"':
                    if(open_quote == null)
                        open_quote = ch;
                    else if(ch === open_quote)
                        open_quote = null;
                    break;
                case "\\":
                    {
                        const nch = subject.charAt(i+1);
                        if(nch == '{' || nch == '}'
                        || nch == '"' || nch == "'")
                            i++;
                    }
                    break;
            }
        }
        if(start_i < subject.length)
            result += subject.substring(start_i);
        return result;
    },
    __process_if_blocks: function(subject, callback, __offset, __subject)
    {
        console.assert(!!subject);
        console.assert(!!callback);
        __offset  = !!__offset  ? __offset : 0;
        __subject = !!__subject ? __subject : subject;
        const is_space    = function(ch) { return (ch == ' ' || ch == "\t" || ch == "\n" || ch == "\v" || ch == "\r"); };
        let   start_i     = 0;
        let   end_i       = null;
        let   open_paren  = 0;
        let   open_braces = 0;
        let   open_quote  = null;
        let   mode        = null;
        let   condition   = null;
        let   code_block  = null;
        for(let i = 0; i < subject.length; i++)
        {
            const ch = subject.charAt(i);
            switch(ch)
            {
                case "(":
                    if(mode == null)
                    {
                        callback(null, null, null, __offset + start_i, __subject);
                        i = subject.length;
                        break;
                    }
                    else if(open_quote == null && open_braces == 0)
                    {
                        if(open_paren == 0)
                            start_i = i + 1;
                        open_paren++;
                    }
                    break;
                case ")":
                    if(open_quote == null && open_braces == 0)
                    {
                        if(open_paren == 1)
                        {
                            end_i   = i;
                            condition = subject.substring(start_i, end_i);
                            start_i = i + 1;
                        }
                        if(open_paren > 0)
                            open_paren--;
                    }
                    break;
                case "{":
                    if(mode == null)
                    {
                        callback(null, null, null, __offset + start_i, __subject);
                        i = subject.length;
                        break;
                    }
                    else if(open_quote == null && open_paren == 0)
                    {
                        if(open_braces == 0)
                            start_i = i + 1;
                        open_braces++;
                    }
                    break;
                case "}":
                    if(open_quote == null && open_paren == 0)
                    {
                        if(open_braces == 1)
                        {
                            end_i   = i;
                            code_block = subject.substring(start_i, end_i);
                            const done = callback(mode, condition, code_block, __offset + start_i, __subject);
                            if(done)
                            {
                                i = subject.length;
                                break;
                            }
                            else
                            {
                                mode       = null;
                                condition  = null;
                                code_block = null;
                            }
                            start_i = i + 1;
                        }
                        if(open_braces > 0)
                            open_braces--;
                    }
                    break;
                case "'":
                case '"':
                    if(open_quote == null)
                        open_quote = ch;
                    else if(ch === open_quote)
                        open_quote = null;
                    break;
                case "\\":
                    {
                        const nch = subject.charAt(i+1);
                        if(nch == '(' || nch == ')'
                        || nch == '{' || nch == '}'
                        || nch == '"' || nch == "'")
                            i++;
                    }
                    break;
                default:
                    if(is_space(ch))
                    {
                        continue;
                    }
                    else if(mode == null)
                    {
                        if(subject.substring(i).search(/^if[\s\(]/g) != -1)
                            mode = 'if';
                        else if(subject.substring(i).search(/^else if[\s\(]/g) != -1)
                            mode = 'else if';
                        else if(subject.substring(i).search(/^else[\s\{]/g) != -1)
                            mode = 'else';
                    }
            }
        }
    },
    __keywords: [
        'new', 'delete', 'eval',
        'if', 'switch', 'case', 'default', 
        'for', 'in', 'of', 'while', 'do',
        'let', 'var', 'const', 'as',
        'function', 'class', 'import', 'export',
    ],
    __validate_value_vars: function(__value)
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
            let rvalue = __value.replaceAll(/(?:(['"])(?:\\\1|.)*?\1|(true|false|null|undefined|[\d\.]+)|([a-zA-Z_][\w\.]*))/gs, function(__match, __p1, __p2, __p3)
            {
                if(!!__p1 || !!__p2)
                    return __match;
                else if(__match == 'null' || __match == 'undefined')
                    return __match;
                else
                {
                    if(jxr.__keywords.indexOf(__p3) != -1)
                        return (__p3);
                    else if(jxr.vars.var_exists('jxr.vars', __p3))
                        return ('jxr.vars.'+jxr.__process_varid(__p3));
                    else if(jxr.vars.var_exists(null, __p3))
                        return (__p3);
                    else
                        return __p3;
                    //     throw __jxr_error('variable `'+__p3+'` is not defined.', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
            });
            return rvalue;
        }
    },
    vars: {
        process: function(expr)
        {
            return jxr.process(null, expr);
        },
        evaluate: function(expr)
        {
            return eval(jxr.__validate_value_vars(expr));
        },
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
                if(cid.search(/^\s*\d+\s*$/g) != -1)
                {
                    const tid = !!root_id && root_id != '' 
                        ? (root_id+'['+cid+']')
                        : cid;
                    return jxr.vars.var_exists(tid, lid);
                }
                else
                {
                    const tid = !!root_id && root_id != '' 
                        ? (root_id+'.'+cid)
                        : cid;
                    return eval('typeof '+tid+' !== "undefined"')
                        && jxr.vars.var_exists(tid, lid);
                }
            }
            else
            {
                if(id.search(/^\s*\d+\s*$/g) != -1)
                {
                    return true;
                }
                else
                {
                    const tid = !!root_id && root_id != '' 
                        ? (root_id+'.'+id)
                        : id;
                    return eval('typeof '+tid+' !== "undefined"');
                }
            }
            return false;
        },
        set_var: function(var_id, value)
        {
            const pvar_id = jxr.__process_varid(var_id);
            jxr.__register_varcode_to_scope('jxr.vars.'+pvar_id);
            const __assignment_code = 'jxr.vars.'+pvar_id+' = value';
            eval(__assignment_code);
        },
        get_var: function(var_id, default_value, assign_default)
        {
            const pvar_id = jxr.__process_varid(var_id);
            if(jxr.vars.var_exists('jxr.vars', pvar_id))
                return eval('jxr.vars.'+pvar_id);
            else if(!!assign_default)
            {
                jxr.__register_varcode_to_scope('jxr.vars.'+pvar_id);
                const __assignment_code = 'jxr.vars.'+pvar_id+' = default_value';
                return eval(__assignment_code);
            }
            else
                return default_value;
        },
        delete_var: function(var_id)
        {
            if(this.var_exists('jxr.vars', var_id))
            {
                eval('delete jxr.vars.'+jxr.__process_varid(var_id));
                return true;
            }
            return false;
        },
        macro_exists: function(macro_id)
        {
            return eval('typeof jxr.macros["'+macro_id+'"] !== "undefined"');
        },
        delete_macro: function(macro_id)
        {
            if(typeof jxr.macros[macro_id] !== "undefined")
            {
                delete jxr.macros[macro_id];
                return true;
            }
            return false;
        },
        set_scope: function(scope_id_l)
        {
            let scope_id = scope_id_l;
            if(typeof jxr.vars.scope_stack === "undefined")
                jxr.vars.scope_stack = [];
            if(!!jxr.vars.scope)
            {
                if(typeof jxr.vars.scope_stack === "undefined")
                    jxr.vars.scope_stack = [];
                const pscope_id   = jxr.vars.scope;
                const pdot_i      = pscope_id.lastIndexOf('.');
                const pscope_id_l = pscope_id.substring(pdot_i == -1 ? 0 : (pdot_i + 1));
                jxr.vars.scope_stack.push(pscope_id_l);
            }
            scope_id = [...jxr.vars.scope_stack, scope_id_l].join('.');
            if(typeof jxr.scope_records[scope_id] === "undefined")
                jxr.scope_records[scope_id] = [];
            jxr.vars.scope = scope_id;
        },
        clear_scope: function()
        {
            let success   = false;
            let pscope_id = null;
            let scope_id  = jxr.vars.scope;
            if(typeof jxr.vars.scope_stack === "undefined")
                jxr.vars.scope_stack = [];
            if(jxr.scope_records[scope_id] instanceof Array)
            {
                let scope_records = jxr.scope_records[scope_id];
                for(let record of scope_records)
                    eval('delete '+record.var_code);
                if(jxr.vars.scope_stack instanceof Array
                && jxr.vars.scope_stack.length > 0)
                {
                    pscope_id = jxr.vars.scope_stack.join('.');
                    jxr.vars.scope_stack.pop();
                }
                if(jxr.scope_records[pscope_id] instanceof Array)
                {
                    let pscope_records = jxr.scope_records[pscope_id];
                    let common_records = jxr.__get_common_records(scope_records, pscope_records)
                    for(let crecord of common_records)
                        eval(crecord.var_code+' = crecord.var_ref');
                }
                delete jxr.scope_records[scope_id];
                jxr.vars.scope = pscope_id;
                success = true;
            }
            return success;
        },
        range: function(count, start, step)
        {
            return { 
                count: !!count ? count : 0, 
                start: !!start ? start : 0, 
                step:  !!step  ? step  : 1, 
            };
        },
        stringify: function(var_)
        {
            if(typeof var_ == 'string')
                return '"'+var_+'"';
            else if(var_ instanceof Object || var_ instanceof Array)
                return JSON.stringify(var_);
            return ''+var_;
        },
        to_upper_case: function(str)
        {
            if(typeof str == 'string')
                return str.toUpperCase();
            return str;
        },
        to_lower_case: function(str)
        {
            if(typeof str == 'string')
                return str.toLowerCase();
            return str;
        },
        to_capital_case: function(str)
        {
            if(typeof str == 'string')
                return str.replaceAll(/(\w)(\w*)/gs, function(match_, p1, p2)
                {
                    return p1.toUpperCase() + p2;
                });
            return str;
        },
        scope_stack: [],
        scope: null,
    },
    macros: {},
    scope_records: {},
    __for_loop_depth: 0,
    __if_condition_depth: 0,
    process: function(__script, __shtml, __script_src_, __script_id_)
    {
        let __skip_indices = [];
        let __html         = null;
        let __script_id    = '';
        let __script_src   = '';
        let __string_quote = null;
        {
            const __strvar = function(var_)
            {
                if(var_ instanceof Object || var_ instanceof Array)
                    return JSON.stringify(var_);
                return ''+var_;
            };
            const __jstrvar = function(var_)
            {
                if(typeof var_ == 'string')
                    return '"'+var_+'"';
                else if(var_ instanceof Object || var_ instanceof Array)
                    return JSON.stringify(var_);
                return ''+var_;
            };
            const __jxr_error = function(err, __shtml, __offset, __script_id, __log_line_numbered_code)
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
                    const attr_id   = __script.getAttribute('id');
                    const attr_src  = __script.getAttribute('src');
                    if(!__script_id)  
                        __script_id = __script_id_;
                    if(!__script_src) 
                        __script_src = __script_src_;
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
                    __string_quote = __script.string_quote;
                }
            }
            // remove comments
            __shtml = __shtml.replaceAll(/\{\*(\\[}{]|.)*?\*\}/gs, '');
            __html  = jxr.__replace_all_blocks(__shtml, function(__p1, __offset)
            {
                const __validate_var_id = function(var_id)
                {
                    if(jxr.__keywords.indexOf(var_id) != -1)
                        throw __jxr_error('variable id `'+var_id+'` is a keyword.', __shtml, __offset, __script_id, __log_line_numbered_code);
                    return var_id;
                };
                __res_i       += __offset - __last_i - 1;
                __last_i       = __offset + __p1.length + 1;
                let   __result = '';
                const __expr   = __p1;
                const rstrmap  = {
                    '|nl':   "\n",
                    '|tab':  "\t",
                    '|c':    ":",
                    '|bo':    "{",
                    '|bc':    "}",
                    '|po':    "(",
                    '|pc':    ")",
                    'b/':    "{",
                    '/b':    "}",
                    'p/':    "(",
                    '/p':    ")",
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
                else if(__expr.search(/^skip\s+.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /^skip\s(.*)/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 2)
                    {
                        const skip_info = {
                            type: 'skip',
                            script_id: __script_id,
                            script_src: __script_src,
                            name: 'skip',
                            body: __rexpr,
                        };
                        const icode = __matches[1];
                        jxr.process(skip_info, icode);
                    }
                }
                else if(__expr.search(/^scope\/.*?\/.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /^scope\/(.*?)\/(.*)/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 2)
                    {
                        const scope_info = {
                            type: 'scope',
                            script_id: __script_id,
                            script_src: __script_src,
                            name: 'scope',
                            body: __rexpr,
                        };
                        const scope_id = eval(jxr.__validate_value_vars(__matches[1]));
                        const icode    = __matches[2];
                        jxr.vars.set_scope(scope_id);
                        __result = jxr.process(scope_info, icode);
                        jxr.vars.clear_scope();
                    }
                    else
                        throw __jxr_error('scope name and body required!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else if(__expr.search(/^\s*\{.*?\}\s*(\|.*)?$/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /^\s*(\{.*?\})\s*(\|.*)?$/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 2)
                    {
                        const wrap_info = {
                            type: 'wrap',
                            script_id: __script_id,
                            script_src: __script_src,
                            name: 'wrap',
                            body: __rexpr,
                            string_quote: '"',
                        };
                        const icode = __matches[1];
                        const __res = jxr.process(wrap_info, icode);
                        if(!!__matches[2])
                        {
                            let __wrapper  = undefined;
                            __matches[2].replaceAll(/\|\s*([a-zA-Z_][\w\.]*)/gs, function(match_, p1)
                            {
                                let __name = p1;
                                if(jxr.vars.var_exists('jxr.vars', __name))
                                    __name = 'jxr.vars.'+jxr.__process_varid(__name);
                                else if(jxr.vars.var_exists(null, __name))
                                    __name = jxr.__process_varid(__name);
                                else 
                                    throw __jxr_error('function `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                                if(!__wrapper)
                                    __wrapper = __name+'('+__res+')';
                                else
                                    __wrapper = __name+'('+__wrapper+')';
                            });
                            __result = eval(__wrapper);
                        }
                        else
                            __result = __res;
                    }
                }
                else if(__expr.search(/^escape\s+.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /^escape\s(.*)/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 2)
                    {
                        __result = __matches[1];
                    }
                }
                else if(__expr.search(/^script\/(?:\\\/|.)*?\/.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /^script\/((?:\\\/|.)*?)\/(.*)/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 2)
                    {
                        let __tag        = 'script';
                        let __attributes = '';
                        if(!!__matches[1])
                        {
                            __attributes = __matches[1].replaceAll(/\s*(\w+)\s*=\s*(['"])((?:\\\2|.)*?)\2(\s|)/gs, function(match_, p1, p2, p3, p4)
                            {
                                if(!!p2)
                                    return p1+'="'+p3+'"'+(!!p4 ? ' ' : '');
                                else
                                    return match_;
                            });
                        }
                        let __inner_html = __matches[2];
                        __result     = '<'+__tag+' '+__attributes+'>'+__inner_html+'</'+__tag+'>';
                    }
                }
                else if(__expr.search(/^\w+\/(?:\\\/|.)*?\/.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /^(\w+)\/((?:\\\/|.)*?)\/(.*)/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 3)
                    {
                        let __tag        = __matches[1];
                        let __attributes = '';
                        if(!!__matches[2])
                        {
                            __attributes = __matches[2].replaceAll(/\s*(\w+)\s*=\s*(['"])((?:\\\2|.)*?)\2(\s|)/gs, function(match_, p1, p2, p3, p4)
                            {
                                if(!!p2)
                                    return p1+'="'+p3+'"'+(!!p4 ? ' ' : '');
                                else
                                    return match_;
                            });
                        }
                        let __inner_html = jxr.process(null, __matches[3]);
                        __result     = '<'+__tag+' '+__attributes+'>'+__inner_html+'</'+__tag+'>';
                    }
                }
                else if(__expr.search(/#\s*(\w+)\s*\(\s*((?:(?:\w+)\s*,?\s*)*)\s*\)\s*\n?(.*?)\n?\s*#/gs) != -1)
                {
                    const __r = /#\s*(\w+)\s*\(\s*((?:(?:\w+)\s*,?\s*)*)\s*\)\s*\n?(.*?)\n?\s*#/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __spexpr[1];
                    // if(typeof jxr.macros[__name] !== 'undefined')
                    //     throw __jxr_error('Macro previously defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                    __spexpr[3] = __spexpr[3].replaceAll(/\\([}{\\])/gs, '$1');
                    const __params = __spexpr[2].split(/\s*,\s*/gs);
                    const __body   = __spexpr[3].replaceAll(/\{\s*(?:(\w+)|#(\w+))?\s*\}/gs, function(__match, __p1, __p2)
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
                }
                else if(__expr.search(/^#\s*\w+\s*\(\s*.*?\s*\)\s*/gs) != -1)
                {
                    const __matches = /\s*(\w+)\s*\(\s*(.*)\s*\)\s*/gs.exec(__expr);
                    const __name    = __matches[1];
                    let   __rparams = __matches[2];
                    let __params = [];
                    __rparams.replaceAll(/(?:\(((?:\\[)(]|.)*?)\)|((?:\\[\\,]|[^,])+))/gs, function(match_, ...args)
                    {
                        if(!!args[0])
                            __params.push(args[0].replaceAll(/\\([\\)(,])/gs, '$1'));
                        else if(!!args[1])
                            __params.push(args[1].replaceAll(/\\([\\)(,])/gs, '$1'));
                        return null;
                    });
                    if(typeof jxr.macros[__name] === 'undefined')
                        throw __jxr_error('Macro not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                    else
                    {
                        const __macro  = jxr.macros[__name];
                        if(__params.length !== __macro.params.length)
                            throw __jxr_error('Macro params mismatch!', __shtml, __offset, __script_id, __log_line_numbered_code);
                        const __body   = __macro.body.replaceAll(/\{(?:#(\w+)|~(\w+))\}/gs, function(__match, __p1, __p2)
                        {
                            if(!!__p2)
                            {
                                const pi     = __macro.params.indexOf(__p2);
                                const pname  = __params[pi].replaceAll(/([}{])/gs, function(match_, p1)
                                {
                                    return p1 == '{' ? '{b/}' : '{/b}';
                                });
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
                else if(__expr.search(/^for\s+.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    const __matches = /for (\w+)\s+(in|of)\s+(.*?)\s*\{(.+)\}\s*$/gs.exec(__rexpr);
                    if(!!__matches && __matches.length >= 4)
                    {
                        const iname   = __matches[1];
                        const in_of   = __matches[2];
                        const ivar    = eval(jxr.__validate_value_vars(__matches[3]));
                        const icode   = __matches[4];
                        const itmp    = jxr.vars[iname];
                        const for_loop_scope_id = 'for_'+(++jxr.__for_loop_depth);
                        const for_info = {
                            type: 'for-loop',
                            script_id: __script_id,
                            script_src: __script_src,
                            name: 'for',
                            body: __rexpr,
                        };
                        jxr.vars.set_scope(for_loop_scope_id);
                        let cresult = '';
                        if(!ivar)
                            throw __jxr_error('invalid for loop iterable variable!', __shtml, __offset, __script_id, __log_line_numbered_code);
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
                                const result = jxr.process(for_info, icode);
                                cresult += result;
                            }
                        }
                        else if(in_of == 'in')
                        {
                            for(let it in ivar)
                            {
                                jxr.vars[iname] = it;
                                const result = jxr.process(for_info, icode);
                                cresult += result;
                            }
                        }
                        else if(in_of == 'of')
                        {
                            for(let it of ivar)
                            {
                                jxr.vars[iname] = it;
                                const result = jxr.process(for_info, icode);
                                cresult += result;
                            }
                        }
                        jxr.vars.clear_scope();
                        jxr.__for_loop_depth--;
                        if(itmp !== undefined)
                            jxr.vars[iname] = itmp;
                        else
                            delete jxr.vars[iname];
                        __result = cresult;
                    }
                    else 
                        throw __jxr_error('invalid for loop code!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else if(__expr.search(/^if\s+.*/gs) != -1)
                {
                    const __rexpr   = __expr.replaceAll(/\\([}{\\])/gs, '$1');
                    jxr.__process_if_blocks(__rexpr, function(__mode, __condition, __code_block)
                    {
                        if(!__mode)
                            throw __jxr_error('invalid if-condition code! expecting if|else if|else', __shtml, __offset, __script_id, __log_line_numbered_code);
                        else if(__mode != 'else' && !__condition)
                            throw __jxr_error('invalid if-condition code! expecting condition code inside parenthesis ()', __shtml, __offset, __script_id, __log_line_numbered_code);
                        else if(!__code_block)
                            throw __jxr_error('invalid if-condition code! expecting code block inside braces {}', __shtml, __offset, __script_id, __log_line_numbered_code);
                        else
                        {
                            __condition = jxr.__validate_value_vars(__condition);
                            const __condval = __mode == 'else' ? true : eval(__condition);
                            if(__condval)
                            {
                                const __if_info = {
                                    type: 'if-condition',
                                    script_id: __script_id,
                                    script_src: __script_src,
                                    name: 'if',
                                    body: __rexpr,
                                };
                                const __if_condition_scope_id = 'if_'+(++jxr.__if_condition_depth);
                                jxr.vars.set_scope(__if_condition_scope_id);
                                __result = jxr.process(__if_info, __code_block);
                                jxr.vars.clear_scope();
                                jxr.__if_condition_depth--;
                                return true;
                            }
                        }
                        return false;
                    });
                }
                else if(__expr.search(/^\!.*$/gs) != -1)
                {
                    const __r = /^\!(.*)$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __code   = __spexpr[1].replaceAll(/\\([}{\\])/gs, '$1');
                    eval(__code);
                }
                else if(__expr.search(/^\^.*$/gs) != -1)
                {
                    const __r = /^\^(.*)$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __code   = __spexpr[1].replaceAll(/\\([}{\\])/gs, '$1');
                    eval('__result = '+__code);
                }
                else if(__expr.search(/^\:.*$/gs) != -1)
                {
                    const __r = /^\:(.*)$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __code   = __spexpr[1].replaceAll(/\\([}{\\])/gs, '$1');
                    eval('__result = function(){'+__code+'}()');
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*=(?!=)\s*.+\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*=\s*(.+)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    let   __value  = __spexpr[2];
                    let   __cvalue = jxr.__validate_value_vars(__value);
                    const __assign_code = 'jxr.vars.'+jxr.__process_varid(__name)+' = '+__cvalue;
                    eval(__assign_code);
                    jxr.__register_varcode_to_scope('jxr.vars.'+jxr.__process_varid(__name));
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*:=(?!=)\s*.+\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*:=\s*(.+)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    let   __value  = __spexpr[2];
                    let   __cvalue = jxr.__validate_value_vars(__value);
                    const __assign_code = 'jxr.vars.'+jxr.__process_varid(__name)+' = '+__cvalue;
                    __result = eval(__assign_code);
                    jxr.__register_varcode_to_scope('jxr.vars.'+jxr.__process_varid(__name));
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*\?\s*.*\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*\?\s*(.*)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    const dvalue = __spexpr[2];
                    if(jxr.__keywords.indexOf(__name) != -1)
                        __result = __name;
                    else if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = eval('jxr.vars.'+jxr.__process_varid(__name));
                    else if(jxr.vars.var_exists(null, __name))
                        __result = eval(jxr.__process_varid(__name));
                    else
                    {
                        if(dvalue == '')
                        {
                            const __assign_code = 'jxr.vars.'+jxr.__process_varid(__name)+' = "undefined"';
                            __result = eval(__assign_code);
                        }
                        else
                        {
                            const __cvalue      = jxr.__validate_value_vars(dvalue);
                            const __assign_code = 'jxr.vars.'+jxr.__process_varid(__name)+' = '+__cvalue;
                            __result = eval(__assign_code);
                        }
                        jxr.__register_varcode_to_scope('jxr.vars.'+jxr.__process_varid(__name));
                    }
                }
                else if(__expr.search(/^\s*[a-zA-Z_][\w\.]*\s*\:\s*.*\s*$/gs) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*\:\s*(.*)\s*$/gs;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    const __dvalue = __spexpr[2];
                    if(jxr.__keywords.indexOf(__name) != -1)
                        __result = __name;
                    else if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = eval('jxr.vars.'+jxr.__process_varid(__name));
                    else if(jxr.vars.var_exists(null, __name))
                        __result = eval(jxr.__process_varid(__name));
                    else
                    {
                        if(__dvalue == '')
                            __result = undefined;
                        else
                        {
                            const __cvalue = jxr.__validate_value_vars(__dvalue);
                            eval('__result = '+__cvalue);
                        }
                    }
                }
                else if(__expr.search(/^\@\s*([a-zA-Z_][\w\.]*)\s*\(\s*.*\s*\)\s*$/g) != -1)
                {
                    const __r = /^@\s*([a-zA-Z_][\w\.]*)\s*\(\s*(.*)\s*\)\s*$/g;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    const __params = __spexpr[2];
                    if(jxr.vars.var_exists('jxr.vars', __name))
                        eval('jxr.vars.'+jxr.__process_varid(__name)
                            +'('+jxr.__validate_value_vars(__params)+')');
                    else if(jxr.vars.var_exists(null, __name))
                        eval(jxr.__process_varid(__name)
                            +'('+jxr.__validate_value_vars(__params)+')');
                    else 
                        throw __jxr_error('function `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else if(__expr.search(/^\s*([a-zA-Z_][\w\.]*)\s*\(\s*.*\s*\)\s*$/g) != -1)
                {
                    const __r = /^\s*([a-zA-Z_][\w\.]*)\s*\(\s*(.*)\s*\)\s*$/g;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    const __params = __spexpr[2];
                    if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = eval('jxr.vars.'+jxr.__process_varid(__name)
                            +'('+jxr.__validate_value_vars(__params)+')');
                    else if(jxr.vars.var_exists(null, __name))
                        __result = eval(jxr.__process_varid(__name)
                            +'('+jxr.__validate_value_vars(__params)+')');
                    else 
                        throw __jxr_error('function `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else if(__expr.search(/^\s*([a-zA-Z_][\w\.]*)\s*$/g) != -1)
                {
                    const __r = /\s*([a-zA-Z_][\w\.]*)\s*/g;
                    const __spexpr = __r.exec(__expr);
                    const __name   = __validate_var_id(__spexpr[1]);
                    if(jxr.vars.var_exists('jxr.vars', __name))
                        __result = eval('jxr.vars.'+jxr.__process_varid(__name));
                    else if(jxr.vars.var_exists(null, __name))
                        __result = eval(jxr.__process_varid(__name));
                    else 
                        throw __jxr_error('variable `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                }
                else
                {
                    let __rexpr = __expr.replaceAll(/([a-zA-Z_][\w\.]*)/g, function(__match, __p1)
                    {
                        const __name = __p1;
                        if(jxr.vars.var_exists('jxr.vars', __name))
                            return 'jxr.vars.'+jxr.__process_varid(__name);
                        else if(jxr.vars.var_exists(null, __name))
                            return jxr.__process_varid(__name);
                        else 
                            throw __jxr_error('variable `'+__name+'` is not defined!', __shtml, __offset, __script_id, __log_line_numbered_code);
                    });
                    __result = eval(__rexpr);
                }
                if(!!__string_quote 
                && typeof __string_quote == 'string' 
                && typeof __result == 'string')
                    __result = __string_quote + __result + __string_quote;
                else
                    __result = __strvar(__result);
                __res_i += __result.length;
                return __result;
            });
        }
        // remove skip blocks
        let thtml  = '';
        {
            const is_space = function(ch) { return (ch == ' ' || ch == "\t" || ch == "\v" || ch == "\r"); };
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
            let e        = document.createElement('div');
            e.innerHTML  = thtml;
            // activate javascript scripts
            if(!!e.getElementsByTagName)
            {
                let target_scripts = e.getElementsByTagName('SCRIPT');
                for(let target_script of target_scripts)
                {
                    const attr_type = target_script.getAttribute('type');
                    if(!attr_type || attr_type == 'text/javascript')
                    {
                        let new_script = document.createElement("script");
                        for(let attr of target_script.attributes)
                            new_script.setAttribute(attr.name, attr.value);
                        new_script.innerHTML = target_script.innerHTML;
                        target_script.replaceWith(new_script);
                    }
                }
            }
            // replace script with elements
            {
                let f        = document.createDocumentFragment();
                let children = [];
                for(let child of e.childNodes)
                    children.push(child);
                for(let child of children)
                    f.appendChild(child);
                __script.replaceWith(f);
                return f;
            }
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
                    try {
                        jxr.process(this.data.script, shtml, this.data.script_src, this.data.script_id_);
                    }
                    catch(e)
                    {
                        console.error(e);
                    }
                }
                else
                    console.error('failed to fetch script `'+this.data.script_src+'`');
            };
            xhr.send();
        }
        else
        {
            try {
                jxr.process(script, script.innerHTML);
            }
            catch(e)
            {
                console.error(e);
            }
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
    fetch: function(uri, async, callback)
    {
        if(typeof uri !== 'string')
            throw Error('jxr.fetch parameter `uri` must be a string');
        if(typeof callback !== 'function')
            throw Error('jxr.fetch parameter `callback` must be a function');
        async = !!async ? true : false;
        let xhr = new XMLHttpRequest();
        xhr.data = {
            uri: uri,
        };
        xhr.open("GET", uri, async);
        xhr.onload = function() 
        {
            if(this.status === 200 && this.readyState === XMLHttpRequest.DONE) 
            {
                try {
                    let script = document.createElement('script');
                    script.setAttribute('type', "text/jxr");
                    script.setAttribute('src', this.data.uri);
                    script.innerHTML = this.responseText;
                    let result = jxr.process(script, this.responseText);
                    callback(result, script);
                }
                catch(e)
                {
                    console.error(e);
                }
            }
            else
                console.error('failed to fetch script `'+this.data.uri+'`');
        };
        xhr.send();
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
