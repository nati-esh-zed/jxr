# jxr

custom HTML script(type='text/jxr') parser for better design.


# sample

[sample](./sample.html) -> [output](./output.html)


```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jxr</title>
    <style>
        html {
            font-family: 'Courier New', Courier, monospace;
        }
        .row { 
            display: flex;
            box-sizing: border-box; 
            background-color: #eee;
            border: 1px solid #aaa;
            border-top: none;
        }
        .col1, .col2 { 
            padding: .4rem .7rem;
            display: inline-block; 
            box-sizing: border-box;
            width: 50%; 
        }
        .col1 { 
            text-align: right;
            border-right: 1px solid #aaa;
        }
    </style>
    <script src="jxr.js"></script>
</head>
<body>
    <script type="text/jxr">
    <main>
        {skip/}
            { tag       = 'div' }
            { tag1      = 'span' }
            { attr      = 'class="row"' }
            { attr1     = 'class="col1"' }
            { attr2     = 'class="col2"' }
            { separator = ' ' }
            { o         = null }
            { bar       = \{ "foo": "foo in bar" \} }
            { fruits    = [ 'apple', 'mango', 'orange' ] }
            { a         = 2 }
            { b         = Math.PI }
            { c         = a + b }
        {/skip}
        <{tag} {attr}>
            <{tag1} {attr1}>Math.PI {separator}</{tag1}>
            <{tag1} {attr2}>{Math.PI}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>a {separator}</{tag1}>
            <{tag1} {attr2}>{a}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>b {separator}</{tag1}>
            <{tag1} {attr2}>{b}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>c {separator}</{tag1}>
            <{tag1} {attr2}>{c}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>d?'default-set' {separator}</{tag1}>
            <{tag1} {attr2}>{d?'default-set'}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>e:'default-dontset' {separator}</{tag1}>
            <{tag1} {attr2}>{e:'default-dontset'}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>d {separator}</{tag1}>
            <{tag1} {attr2}>{d:'undefined'}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>e {separator}</{tag1}>
            <{tag1} {attr2}>{e:'undefined'}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>document.title = 'hello'  {separator}</{tag1}>
            <{tag1} {attr2}>{document.title = 'hello'}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>^document.title = 'hello' {separator}</{tag1}>
            <{tag1} {attr2}>{^document.title = 'hello'}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>bar {separator}</{tag1}>
            <{tag1} {attr2}>{bar}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>bar {separator}</{tag1}>
            <{tag1} {attr2}>{bar.foo}</{tag1}>
        </{tag}>
        <{tag} {attr}>
            <{tag1} {attr1}>fruits {separator}</{tag1}>
            <{tag1} {attr2}>{fruits}</{tag1}>
        </{tag}>
    </main>
    </script>
    <script type="text/jxr" src="hello.jxr" async></script>
</body>
</html>
 ```

output

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>hello</title>
    <style>
        html {
            font-family: 'Courier New', Courier, monospace;
        }
        .row {
            display: flex;
            box-sizing: border-box;
            background-color: #eee;
            color: #333;
            border: 1px solid #aaa;
            border-top: none;
        }
        .col1, .col2 {
            padding: .4rem .7rem;
            display: inline-block;
            box-sizing: border-box;
            width: 50%;
        }
        .col1 {
            text-align: right;
            border-right: 1px solid #aaa;
        }
    </style>
    <script src="jxr.js"></script>
</head>
<body>
    <main>
        <div class="row">
            <span class="col1">Math.PI </span>
            <span class="col2">3.141592653589793</span>
        </div>
        <div class="row">
            <span class="col1">a </span>
            <span class="col2">2</span>
        </div>
        <div class="row">
            <span class="col1">b </span>
            <span class="col2">3.141592653589793</span>
        </div>
        <div class="row">
            <span class="col1">c </span>
            <span class="col2">5.141592653589793</span>
        </div>
        <div class="row">
            <span class="col1">d?'default-set' </span>
            <span class="col2">default-set</span>
        </div>
        <div class="row">
            <span class="col1">e:'default-dontset' </span>
            <span class="col2">default-dontset</span>
        </div>
        <div class="row">
            <span class="col1">d </span>
            <span class="col2">default-set</span>
        </div>
        <div class="row">
            <span class="col1">e </span>
            <span class="col2">undefined</span>
        </div>
        <div class="row">
            <span class="col1">document.title = 'hello' </span>
            <span class="col2"></span>
        </div>
        <div class="row">
            <span class="col1">^document.title = 'hello' </span>
            <span class="col2">hello</span>
        </div>
        <div class="row">
            <span class="col1">bar </span>
            <span class="col2">{"foo":"foo in bar"}</span>
        </div>
        <div class="row">
            <span class="col1">bar </span>
            <span class="col2">foo in bar</span>
        </div>
        <div class="row">
            <span class="col1">fruits </span>
            <span class="col2">["apple","mango","orange"]</span>
        </div>
    </main>
    <div>
        <h1>hello stranger.</h1>
    </div>

</body>
</html>
```