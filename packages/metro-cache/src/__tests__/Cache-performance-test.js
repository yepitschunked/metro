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

  test.skip('does a lot of gc', async () => {
    // Logger creates many objects.
    logFn.mockImplementation(item => {
      return {
        a: item.action_name,
        l: item.log_entry_label,
        p: item.action_phase,
      };
    });
    const store1 = createStore('Local');
    const cache = new Cache([store1]);

    store1.get.mockImplementation(() => 'bar');

    for (let i = 0; i < 1000000; i++) {
      await cache.get(Buffer.from('foo'));
    }

    expect(logFn).toHaveBeenCalledTimes(3000000);
  }, 60000);

  test('does not alot of gc', async () => {
    // Logger is roughly a no-op
    const store1 = createStore('Local');
    const cache = new Cache([store1]);

    store1.get.mockImplementation(() => 'bar');

    for (let i = 0; i < 1000000; i++) {
      await cache.get(Buffer.from('foo'));
    }

    expect(logFn).toHaveBeenCalledTimes(3000000);
  }, 60000);
});
