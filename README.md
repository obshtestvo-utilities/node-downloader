# node-downloader

## What this is
Thin wrapper on top of `request` package which adds:

 1. Browser spoofing
 1. Saving url content to disk
 1. Request queue
 1. Random timeout between requests. The range is specified as an array
 1. Logging capabilities
   - The passed logger object should implement an `error` method

## Example usage

```js
var logger = {
  error: function(msg) {
    console.log(msg)
  }
}
var downloader =  new Downloader(logger, [1000, 5000]); // delay 1 and 5 seconds between each requests
downloader.get('http://www.google.com/').then(function(contents) {
    // do something with contents
})
```