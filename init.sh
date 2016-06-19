#!/bin/sh

set -ex

git submodule update --depth 1 --init
cp mecab-ipadic-neologd/seed/mecab-user-dict-seed* neologd-seed/mecab-user-dict-seed.csv.xz
unxz neologd-seed/mecab-user-dict-seed.csv.xz

