require('dotenv').config({silent: true});
const aws = require('aws-sdk');
const {pad} = require('./common/util');

const simpledb = new aws.SimpleDB({
  region    : process.env.SDB_REGION,
  endpoint  : process.env.SDB_ENDPOINT
});
const DomainName = process.env.SDB_DOMAIN_NAME;

module.exports = {
  getTime(ItemName) {
    return new Promise((resolve, reject) =>
      simpledb.getAttributes({DomainName, ItemName}, (err, {Attributes}) => {
        if (err) { return reject(err); }
        if (!Attributes) { return resolve(0); }
        let time;
        Attributes.some(({Name, Value}) => {
          if (Name === 'time') { return time = Value; }
        });
        resolve(parseInt(time));
      })
    );
  },
  saveTime(ItemName, time) {
    timeS = pad(time, 10);
    return new Promise((resolve, reject) => {
      simpledb.putAttributes({
        DomainName,
        ItemName,
        Attributes: [{Name: 'time', Value: timeS, Replace: true}]
      }, err => err ? reject(err) : setTimeout(() => resolve(time), 500))
    });
  },
  getPlace(time) {
    const timeS = pad(time, 10);
    return new Promise((resolve, reject) => {
      simpledb.select(
        {SelectExpression  : `select count(*) from \`${DomainName}\` where time > '${timeS}'`},
        (err, {Items}) => err ? reject(err) : resolve(parseInt(Items[0].Attributes[0].Value))
      )
    });
  },
  getLeaderboard() {
    return new Promise((resolve, reject) =>
      simpledb.select(
        {SelectExpression  : `select * from \`${DomainName}\` where time is not null order by time desc limit 100`},
        (err, {Items}) => err ? reject(err) : resolve(Items && Items
          .map(({Name, Attributes}) => Object.assign({name: Name},
            Attributes.reduce((res, {Name, Value}) => Object.assign(res, {[Name]: Value}), {})
          ))
          .map(item => Object.assign(item, {time: parseInt(item.time)}))
        )
      )
    );
  }
}
