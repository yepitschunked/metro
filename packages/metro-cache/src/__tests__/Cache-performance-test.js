/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';
const v8 = require('v8');
describe('Cache Performance', () => {
  let Cache;
  let Logger;
  let logFn;

  function createStore(name: string = '') {
    // eslint-disable-next-line no-eval
    const TempClass = eval(`(class ${name} {})`);

    // $FlowFixMe[unsafe-object-assign]
    return Object.assign(new TempClass(), {
      get: jest.fn().mockImplementation(() => null),
      set: jest.fn(),
    });
  }

  beforeEach(() => {
    Logger = require('metro-core').Logger;
    Cache = require('../Cache');
    logFn = jest.fn();
    Logger.on('log', logFn);
  });

  afterEach(() => {
    jest.resetModules().restoreAllMocks();
  });

  function aggregateStats(stats) {
    return stats.statistics.reduce((memo, entry) => {
      const stat = memo[entry.gcType] || { count: 0, cost: 0 };
      stat.count += 1;
      stat.cost += entry.cost;
      memo[entry.gcType] = stat;
      return memo;
    }, {});
  }

  test('does a lot of gc', async () => {
    const store1 = createStore('Local');
    const cache = new Cache([store1], true);

    store1.get.mockImplementation(() => 'bar');

    const profiler = new v8.GCProfiler();
    profiler.start();
    for (let i = 0; i < 1000000; i++) {
      await cache.get(Buffer.from('foo'));
    }
    const stats = profiler.stop();
    const agg = aggregateStats(stats);

    console.log(agg);

    expect(logFn).toHaveBeenCalledTimes(3000000);
  }, 60000);

  test('does not alot of gc', async () => {
    // Logger is roughly a no-op
    const store1 = createStore('Local');
    const cache = new Cache([store1], false);

    store1.get.mockImplementation(() => 'bar');

    const profiler = new v8.GCProfiler();
    profiler.start();
    for (let i = 0; i < 1000000; i++) {
      await cache.get(Buffer.from('foo'));
    }

    const stats = profiler.stop();
    const agg = aggregateStats(stats);

    console.log(agg);
  }, 60000);
});
