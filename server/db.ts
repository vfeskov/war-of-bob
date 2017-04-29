import {SimpleDB} from 'aws-sdk';
import {Observable as $} from 'rxjs/Observable';
import {pad} from './util';

export {
  getTime,
  saveTime,
  getPlace,
  getLeaderboard
};

const {assign} = Object;

const DomainName = process.env.SDB_DOMAIN_NAME;
const origSimpledb = new SimpleDB({
  region    : process.env.SDB_REGION,
  endpoint  : process.env.SDB_ENDPOINT
});

const simpleDb = ['getAttributes', 'putAttributes', 'select']
  .reduce((result, method) =>
    assign(result, {[method]: params => bindSimpleDBMethod(method, params)}),
    {}
  ) as RxSimpleDB;

function getTime(ItemName) {
  return simpleDb.getAttributes({DomainName, ItemName})
    .map(({Attributes}) => {
      if (!Attributes) { return 0; }
      let time = '0';
      Attributes.some(({Name, Value}) => {
        if (Name === 'time') { return !!(time = Value); }
      });
      return parseInt(time);
    });
}

function saveTime(ItemName, time) {
  return simpleDb.putAttributes({
      DomainName,
      ItemName,
      Attributes: [{Name: 'time', Value: pad(time, 10), Replace: true}]
    })
    .delay(500);
}

function getPlace(time) {
  const timeS = pad(time, 10);
  return simpleDb.select({
      SelectExpression: `select count(*) from \`${DomainName}\` where time > '${timeS}'`
    })
    .map(({Items}) => parseInt(Items[0].Attributes[0].Value));
}

function getLeaderboard() {
  return simpleDb.select({
      SelectExpression: `select * from \`${DomainName}\` where time is not null order by time desc limit 100`
    })
    .map(({Items}) => Items && Items
      .map(({Name, Attributes}) => assign({name: Name},
        Attributes.reduce((res, {Name, Value}) => assign(res, {[Name]: Value}), {}) as any
      ))
      .map(item => assign(item, {time: parseInt(item.time)}))
    );
}

function bindSimpleDBMethod(methodName, params) {
  return new $(subscriber => {
    const request = origSimpledb[methodName](params, (err, data) => {
      if (err) { return subscriber.error(err); }
      subscriber.next(data);
      subscriber.complete();
    });
    return () => request.abort();
  });
}

interface RxSimpleDB {
  getAttributes(params?: SimpleDB.Types.GetAttributesRequest): $<SimpleDB.GetAttributesResult>;
  putAttributes(params?: SimpleDB.Types.PutAttributesRequest): $<{}>;
  select(params?: SimpleDB.Types.SelectRequest): $<SimpleDB.Types.SelectResult>;
}
