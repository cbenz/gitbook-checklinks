# GitBook internal links checker

## DISCONTINUED!

I do not work on that project anymore. There is a solution to detect dangling links, even in a programmatic way.

See [this line of `package.json`](https://github.com/openfisca/openfisca-doc/blob/fe4417aafa70df45885509ca8b43f30a618e94b8/package.json#L15) which fails if `gitbook build` produces any *warning*.

## Presentation

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
