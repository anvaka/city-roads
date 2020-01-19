#!/bin/sh
rm -rf ./dist
npm run build
cd ./dist
git init
git add .
git commit -m 'push to gh-pages'
git push --force git@github.com:anvaka/city-roads.git master:gh-pages
cd ../
git tag `date "+release-%Y%m%d%H%M%S"`
git push --tags
