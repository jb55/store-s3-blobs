"use strict"

const blobs = require('s3-blob-store')
const async = require('async')
const aws = require('aws-sdk')
const crypto = require('crypto')
const once = require('once')
const fs = require('fs')
const EventEmitter = require('events')

class BlobEmitter extends EventEmitter {}

function sha1sum(file, done) {
  var fd = fs.createReadStream(file);
  var hash = crypto.createHash('sha1');
  hash.setEncoding('hex');

  fd.on('end', function() {
    hash.end();
    done(null, hash.read())
  });

  fd.on('error', function(err) {
    done(err);
  });

  // read all file and pipe it (write it) to the hash object
  fd.pipe(hash);
}

function doUpload(store, key, file, done) {
  done = once(done)
  fs.createReadStream(file)
    .pipe(store.createWriteStream({ key: key }))
    .on('error', done)
    .on('finish', done)
}

function upload(opts) {

  return function uploadFile(file, done) {
    opts.emitter.emit("log", { event: "upload", file: file });

    sha1sum(file, function(err, sha1) {
      if (err) return done(err);
      const key = opts.prefix + sha1;

      function doneUpload(err) {
        if (err) return done(err);
        opts.emitter.emit("log", { event: "uploaded", file: file, key: key, sha1: sha1 })
        return done()
      }

      if (!opts.force) {
        opts.store.exists({ key: key }, function(err, exists) {
          if (err) return done(err)
          opts.emitter.emit("log", { event: "exists", file: file, key: key, sha1: sha1, exists: exists })
          if (exists)
            done(null)
          else
            doUpload(opts.store, key, file, doneUpload)
        })
      }
      else {
        doUpload(opts.store, key, file, doneUpload)
      }
    })

  }
}

module.exports = function(opts, files, done) {
  const bucket = opts.bucket;
  var creds = {}
  const concurrency = opts.concurrency == null ? 6 : opts.concurrency;
  const force = opts.force == null ? false : opts.force;
  const emitter = opts.emitter || new BlobEmitter();
  const prefix = opts.prefix == null ? "" : opts.prefix;

  creds.accessKeyId = opts.accessKeyId || process.env.S3_ACCESS_KEY
  creds.secretAccessKey = opts.secretAccessKey || process.env.S3_SECRET_KEY

  var client = opts.client || new aws.S3(creds)

  var store = blobs({
    client: client,
    bucket: bucket
  });

  var uploadOpts = {
    force: force,
    emitter: emitter,
    prefix: prefix,
    store: store
  }

  async.eachLimit(files, concurrency, upload(uploadOpts), done)
}
