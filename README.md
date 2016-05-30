# GitBook internal links checker

This program checks dead links in GitBook source code repositories, especially internal links to other `.md` files.

To check dead links in general, please use a dedicated software
like [linkchecker](https://github.com/wummel/linkchecker) or [croquemort](https://github.com/davidbgk/croquemort).

> This repo is not yet published to npm.

## Development install

```
sudo npm link .
```

## Usage

```
Usage:
  gitbook-checklinks <dir_path>

  <dir_path> is a directory with `.md` files.
```

Example on [samples](samples) dir:

```
gitbook-checklinks samples
{
  "sample2.md": [
    {
      "title": "internal dead link",
      "href": "./sample3.md",
      "image": false
    }
  ]
}
```
