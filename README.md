# jxr

custom HTML script(type='text/jxr') parser for better design.


# sample

[sample](./sample.html) -> [output](./output.html)


```html
<main>
  {skip/}
    {#ROW (varid) 
       <{tag} {attr}>
        <{tag1} {attr1}>{#varid}</{tag1}>
        <{tag1} {attr2}>{varid}</{tag1}>
       </{tag}>
    #}
    { tag       = 'div' }
    { tag1      = 'span' }
    { attr      = 'class="row"' }
    { attr1     = 'class="col1"' }
    { attr2     = 'class="col2"' }
    { o         = null }
    { a         = 2 }
    { b         = Math.PI }
    { c         = a + b }
    { bar       = \{ "foo": "foo in bar" \} }
    { fruits    = [ 'apple', 'mango', 'orange' ] }
    {! console.log('hello from jxr!')}
  {/skip}
  {#ROW(Math.PI)}
  {#ROW(o)}
  {#ROW(a)}
  {#ROW(b)}
  {#ROW(c)}
  {#ROW(d?'default-set')}
  {#ROW(e:'default-dont-set')}
  {#ROW(d)}
  {#ROW(e:)}
  {#ROW(^document.title = 'hello')}
  {#ROW(bar)}
  {#ROW(bar.foo)}
  {#ROW(fruits)}
  {#ROW(fruits[1])}
  <ul>
  {for fruit in fruits:
    <li>\{fruit\}</li>\{|nl\}
  }
  </ul>
  <ol>
  {for i in range(5,1,2):
    <li>item \{i\}</li>
  }
  </ol>
  {i = 1}
  {if true: <p>if-true-0</p> }        
  {if i == 0:
    <p>if-i-1</p>
  :else:
    <p>else-i-1</p>
  }
  {if i == 0:
    <p>if-i-2</p>
  :elseif i == 1:
    <p>elseif-i-2</p>
  :else:
    <p>else-i-2</p>
  }
</main>
 ```

output

```html
<main>
  <div class="row">
    <span class="col1">Math.PI</span>
    <span class="col2">3.141592653589793</span>
  </div>
  <div class="row">
    <span class="col1">o</span>
    <span class="col2">null</span>
  </div>
  <div class="row">
    <span class="col1">a</span>
    <span class="col2">2</span>
  </div>
  <div class="row">
    <span class="col1">b</span>
    <span class="col2">3.141592653589793</span>
  </div>
  <div class="row">
    <span class="col1">c</span>
    <span class="col2">5.141592653589793</span>
  </div>
  <div class="row">
    <span class="col1">d?'default-set'</span>
    <span class="col2">default-set</span>
  </div>
  <div class="row">
    <span class="col1">e:'default-dontset'</span>
    <span class="col2">default-dontset</span>
  </div>
  <div class="row">
    <span class="col1">d</span>
    <span class="col2">default-set</span>
  </div>
  <div class="row">
    <span class="col1">e:</span>
    <span class="col2">undefined</span>
  </div>
  <div class="row">
    <span class="col1">document.title = 'hello'</span>
    <span class="col2"></span>
  </div>
  <div class="row">
    <span class="col1">document.title = 'hello'</span>
    <span class="col2"></span>
  </div>
  <div class="row">
    <span class="col1">bar</span>
    <span class="col2">{"foo":"foo in bar"}</span>
  </div>
  <div class="row">
    <span class="col1">bar.foo</span>
    <span class="col2">foo in bar</span>
  </div>
  <div class="row">
    <span class="col1">fruits</span>
    <span class="col2">["apple","mango","orange"]</span>
  </div>
  <div class="row">
    <span class="col1">fruits[1]</span>
    <span class="col2">mango</span>
  </div>
  <ul>
    <li>apple</li>
    <li>mango</li>
    <li>orange</li>
  </ul>
  <ol>
    <li>item 1</li>
    <li>item 3</li>
    <li>item 5</li>
  </ol>
  <p>if-true-0</p>         
  <p>else-i-1</p>
  <p>elseif-i-2</p>   
</main>
<div>
  <h1>hello stranger.</h1>
</div>
<div id="index-1">put inside a div with parent script.id</div>
```