import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './inject-redis.decorator';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    scan: jest.Mock;
    exists: jest.Mock;
    expire: jest.Mock;
    ttl: jest.Mock;
    incr: jest.Mock;
    hset: jest.Mock;
    hget: jest.Mock;
    hgetall: jest.Mock;
    hdel: jest.Mock;
    sadd: jest.Mock;
    smembers: jest.Mock;
    srem: jest.Mock;
    pipeline: jest.Mock;
    options: { keyPrefix?: string };
  };

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      incr: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      srem: jest.fn(),
      pipeline: jest.fn(),
      options: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return parsed JSON when value is JSON', async () => {
      mockRedis.get.mockResolvedValue('{"a":1}');
      expect(await service.get('k')).toEqual({ a: 1 });
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      expect(await service.get('k')).toBeNull();
    });

    it('should return raw string when value is not JSON', async () => {
      mockRedis.get.mockResolvedValue('plain');
      expect(await service.get('k')).toBe('plain');
    });
  });

  describe('set', () => {
    it('should serialize object and set with TTL', async () => {
      mockRedis.set.mockResolvedValue(undefined);
      await service.set('k', { x: 1 }, 120);
      expect(mockRedis.set).toHaveBeenCalledWith('k', '{"x":1}', 'EX', 120);
    });

    it('should set string without TTL', async () => {
      mockRedis.set.mockResolvedValue(undefined);
      await service.set('k', 'v');
      expect(mockRedis.set).toHaveBeenCalledWith('k', 'v');
    });
  });

  describe('del', () => {
    it('should call redis del', async () => {
      mockRedis.del.mockResolvedValue(1);
      await service.del('k');
      expect(mockRedis.del).toHaveBeenCalledWith('k');
    });
  });

  describe('delPattern', () => {
    it('should scan and delete keys matching pattern', async () => {
      mockRedis.options.keyPrefix = 'dabdub:';
      mockRedis.scan
        .mockResolvedValueOnce(['0', ['dabdub:cache:merchants:1', 'dabdub:cache:merchants:2']])
        .mockResolvedValueOnce(['0', []]);
      mockRedis.del.mockResolvedValue(undefined);
      await service.delPattern('cache:merchants:*');
      expect(mockRedis.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'dabdub:cache:merchants:*',
        'COUNT',
        100,
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'cache:merchants:1',
        'cache:merchants:2',
      );
    });

    it('should handle no prefix', async () => {
      mockRedis.options.keyPrefix = '';
      mockRedis.scan
        .mockResolvedValueOnce(['0', ['cache:merchants:1']])
        .mockResolvedValueOnce(['0', []]);
      mockRedis.del.mockResolvedValue(undefined);
      await service.delPattern('cache:merchants:*');
      expect(mockRedis.del).toHaveBeenCalledWith('cache:merchants:1');
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      expect(await service.exists('k')).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);
      expect(await service.exists('k')).toBe(false);
    });
  });

  describe('expire', () => {
    it('should call redis expire', async () => {
      mockRedis.expire.mockResolvedValue(1);
      await service.expire('k', 60);
      expect(mockRedis.expire).toHaveBeenCalledWith('k', 60);
    });
  });

  describe('ttl', () => {
    it('should return ttl', async () => {
      mockRedis.ttl.mockResolvedValue(45);
      expect(await service.ttl('k')).toBe(45);
    });
  });

  describe('incr', () => {
    it('should return incremented value', async () => {
      mockRedis.incr.mockResolvedValue(2);
      expect(await service.incr('k')).toBe(2);
    });
  });

  describe('hset/hget/hgetall/hdel', () => {
    it('should hset and hget', async () => {
      mockRedis.hset.mockResolvedValue(undefined);
      mockRedis.hget.mockResolvedValue('val');
      await service.hset('k', 'f', 'val');
      expect(mockRedis.hset).toHaveBeenCalledWith('k', 'f', 'val');
      expect(await service.hget('k', 'f')).toBe('val');
    });

    it('should hgetall return record or null', async () => {
      mockRedis.hgetall.mockResolvedValue({ a: '1', b: '2' });
      expect(await service.hgetall('k')).toEqual({ a: '1', b: '2' });
      mockRedis.hgetall.mockResolvedValue({});
      expect(await service.hgetall('k')).toBeNull();
    });

    it('should hdel', async () => {
      mockRedis.hdel.mockResolvedValue(1);
      await service.hdel('k', 'f');
      expect(mockRedis.hdel).toHaveBeenCalledWith('k', 'f');
    });
  });

  describe('sadd/smembers/srem', () => {
    it('should sadd and smembers', async () => {
      mockRedis.sadd.mockResolvedValue(1);
      mockRedis.smembers.mockResolvedValue(['a', 'b']);
      await service.sadd('k', 'a', 'b');
      expect(mockRedis.sadd).toHaveBeenCalledWith('k', 'a', 'b');
      expect(await service.smembers('k')).toEqual(['a', 'b']);
    });

    it('should srem', async () => {
      mockRedis.srem.mockResolvedValue(1);
      await service.srem('k', 'a');
      expect(mockRedis.srem).toHaveBeenCalledWith('k', 'a');
    });
  });

  describe('pipeline', () => {
    it('should execute pipeline and return results', async () => {
      const execMock = jest.fn().mockResolvedValue([
        [null, 'v1'],
        [null, 'OK'],
      ]);
      mockRedis.pipeline.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        exec: execMock,
      });
      const results = await service.pipeline([
        ['get', 'k1'],
        ['set', 'k2', 'v2'],
      ]);
      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(results).toEqual(['v1', 'OK']);
    });
  });
});
