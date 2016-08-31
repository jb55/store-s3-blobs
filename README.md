
# store-s3-blobs

Small CLI utility for quickly storing sha1-hashed blobs into S3

## Installation

  Install with npm

    $ npm install store-s3-blobs

## Usage

```
usage: store-s3-blobs [OPTIONS] <FILE>...

    --prefix=blobs/     hash prefix                    (optional)
    --bucket=mybucket   S3 Bucket                      (required)
    --digest=sha256     hash function                  (optional, default: sha1)
    --force=true        don't skip if already uploaded (optional, default: false)
```
