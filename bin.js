"use strict"

const EventEmitter = require('events')
const path = require('path')

class BlobEmitter extends EventEmitter {}

function usage() {
  console.log("usage: store-s3-blobs [OPTIONS] <FILE>...")
  console.log("")
  console.log("    --prefix=blobs/     hash prefix                    (optional)")
  console.log("    --bucket=mybucket   S3 Bucket                      (required)")
  console.log("    --digest=sha256     hash function                  (optional, default: sha1)")
  console.log("    --force=true        don't skip if already uploaded (optional, default: false)")
  console.log("")
  process.exit(1);
}

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    bucket: "b",
    force: "f",
    prefix: "p"
  }
})

if (!argv.bucket) return usage();

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
