# financier-editor
https://camillakey.github.io/financier-editor/

# Syntax
## Markdown
~~~
# code
```
code
```

# blockquote
> blockquote
> blockquote

# hr
---

# list
* list1
* list2
  * list2.1


1. list1
1. list2
  1. list2.1

# table
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

Markdown | Less | Pretty
--- | --- | ---
*Still* | `renders` | **nicely**
1 | 2 | 3

# strong
**strong**

# em
*em text*

# codespan
`codespan`

# br
br is  
two space.

# del
~~del text~~

# link
[financier editor](https://github.com/camillakey/financier-editor)

# raw HTML
<p style="color: #00a;">raw HTML</p>
~~~

## Financier's
~~~
# Caption
[](#financier-syntax-code-caption)

| #financier-syntax-code-caption caption
```
code
```

[](#financier-syntax-table-caption)

| #financier-syntax-table-caption caption
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

# Code
| `C Hello World`
```c[line-numbers]
#include <stdio.h>
int main(void) {
    printf("Hello, World\n");
    return 0;
}
```

| `Java Hello World`
```java[line-numbers/2]
    public static void main(String args) {
        System.out.println("Hello World");
    }
```

# `id`，`class`
## #id1.class-name-1 header with id, class
### #id2.class-name-2 header with id, class

# #financier-syntax-link-internal internal link
[](#financier-syntax-link-internal)
~~~
