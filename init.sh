#!/bin/sh

set -ex

git submodule update --init
cp mecab-ipadic-neologd/seed/mecab-user-dict-seed* neologd-seed/
unxz neologd-seed/mecab-user-dict-seed*

