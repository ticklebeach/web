# web

This repo is a copy of our internal repo, I'm going to be moving files over one at a time as I get
them cleaned up and explain each.

So far, you can run it and make an minified version of the viewer which will eventually be embedded
in a file, and served via contracts.

## Setup

If you need yarn explained, you may need to start somewhere else.

```
yarn
```

## Start

runs overmind & proc stuff. gulp is used to process the GLSL files and webpack packs them up in to a bunch of files.
Output is in ./public

```
./start.sh
```

## Preview

Will show the default viewer.html with the default seed.

```
open public/viewer.html
```
