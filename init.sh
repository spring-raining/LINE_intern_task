#!/bin/sh

set -ex

git submodule update --init
cp mecab-ipadic-neologd/seed/mecab-user-dict-seed* neologd-seed/mecab-user-dict-seed.csv.xz
unxz neologd-seed/mecab-user-dict-seed.csv.xz

