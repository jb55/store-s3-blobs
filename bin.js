"use strict"

const EventEmitter = require('events')
const path = require('path')

class BlobEmitter extends EventEmitter {}

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    bucket: "b",
    force: "f",
    prefix: "p"
  }
})

var store = require('./')

const emitter = argv.emitter = new BlobEmitter();

emitter.on('log', function(event) {
  switch (event.event) {
  case "uploaded":
    console.error(event.event, path.basename(event.file), "->", event.key)
    break;
  case "exists":
    if (event.exists) {
      console.error(event.file, "(" + event.key + ")", "is already uploaded")
    }
    break;
  }
})

store(argv, argv._, function(err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
})
