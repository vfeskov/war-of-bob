'use strict';
require('dotenv').config({silent: true});
const aws = require('aws-sdk'),
  {Observable: $} = require('rxjs'),
  {pad} = require('./util'),
  {assign} = Object;

const DomainName = process.env.SDB_DOMAIN_NAME;
const origSimpledb = new aws.SimpleDB({
    region    : process.env.SDB_REGION,
    endpoint  : process.env.SDB_ENDPOINT
  });
const simpledb = ['getAttributes', 'putAttributes', 'select']
    .map(method => [method, $.bindNodeCallback(origSimpledb[method].bind(origSimpledb))])
    .reduce((res, [method, observable]) => assign(res, {[method]: observable}), {});

module.exports = {getTime, saveTime, getPlace, getLeaderboard};

function getTime(ItemName) {
  return simpledb.getAttributes({DomainName, ItemName})
    .map(({Attributes}) => {
      if (!Attributes) { return 0; }
      let time = 0;
      Attributes.some(({Name, Value}) => {
        if (Name === 'time') { return time = Value; }
      });
      return parseInt(time);
    });
}

function saveTime(ItemName, time) {
  return simpledb.putAttributes({
      DomainName,
      ItemName,
      Attributes: [{Name: 'time', Value: pad(time, 10), Replace: true}]
    })
    .delay(500)
    .mapTo(time);
}

function getPlace(time) {
  const timeS = pad(time, 10);
  return simpledb.select({
      SelectExpression: `select count(*) from \`${DomainName}\` where time > '${timeS}'`
    })
    .map(({Items}) => parseInt(Items[0].Attributes[0].Value))
}

function getLeaderboard() {
  return simpledb.select({
      SelectExpression: `select * from \`${DomainName}\` where time is not null order by time desc limit 100`
    })
    .map(({Items}) => Items && Items
      .map(({Name, Attributes}) => assign({name: Name},
        Attributes.reduce((res, {Name, Value}) => assign(res, {[Name]: Value}), {})
      ))
      .map(item => assign(item, {time: parseInt(item.time)}))
    );
}
