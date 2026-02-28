const { createProduct, getAllProducts } = require('../controllers/productController');

jest.mock('../models/Product', () => ({
  create: jest.fn(),
  find: jest.fn(() => ({ limit: jest.fn() })),
}));

const Product = require('../models/Product');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('productController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should return 400 when name is missing', async () => {
      const req = { body: { price: 100 } };
      const res = makeRes();

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Missing Data' });
      expect(Product.create).not.toHaveBeenCalled();
    });

    it('should return 400 when price is missing', async () => {
      const req = { body: { name: 'Item' } };
      const res = makeRes();

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Missing Data' });
      expect(Product.create).not.toHaveBeenCalled();
    });

    it('should create product and return 201', async () => {
      const req = { body: { name: 'Item', price: 50 } };
      const res = makeRes();
      const created = { _id: '1', name: 'Item', price: 50 };
      Product.create.mockResolvedValue(created);

      await createProduct(req, res);

      expect(Product.create).toHaveBeenCalledWith({ name: 'Item', price: 50 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Product Created', data: created });
    });

    it('should handle server error on create', async () => {
      const req = { body: { name: 'Item', price: 50 } };
      const res = makeRes();
      Product.create.mockRejectedValue(new Error('db down'));

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Server Error' });
    });
  });

  describe('getAllProducts', () => {
    it('should default limit to 10 when not provided', async () => {
      const req = { query: {} };
      const res = makeRes();

      const mockLimit = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
      Product.find.mockReturnValue({ limit: mockLimit });

      await getAllProducts(req, res);

      expect(Product.find).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('10');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Products fetched', data: [{ id: 1 }, { id: 2 }] });
    });

    it('should apply provided numeric limit', async () => {
      const req = { query: { limit: 5 } };
      const res = makeRes();

      const mockLimit = jest.fn().mockResolvedValue(['a', 'b', 'c']);
      Product.find.mockReturnValue({ limit: mockLimit });

      await getAllProducts(req, res);

      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Products fetched', data: ['a', 'b', 'c'] });
    });

    it('should handle server error on find', async () => {
      const req = { query: {} };
      const res = makeRes();

      const mockLimit = jest.fn().mockRejectedValue(new Error('db down'));
      Product.find.mockReturnValue({ limit: mockLimit });

      await getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Server Error' });
    });

    // New behaviors
    it('should coerce string numeric limit to number when provided as string', async () => {
      const req = { query: { limit: '7' } };
      const res = makeRes();
      const mockLimit = jest.fn().mockResolvedValue(['x']);
      Product.find.mockReturnValue({ limit: mockLimit });

      await getAllProducts(req, res);

      expect(mockLimit).toHaveBeenCalledWith('7');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Products fetched', data: ['x'] });
    });

    it('should pass through zero limit when provided (edge case)', async () => {
      const req = { query: { limit: 0 } };
      const res = makeRes();
      const mockLimit = jest.fn().mockResolvedValue([]);
      Product.find.mockReturnValue({ limit: mockLimit });

      await getAllProducts(req, res);

      expect(mockLimit).toHaveBeenCalledWith(0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Products fetched', data: [] });
    });

    it('should call Product.find exactly once', async () => {
      const req = { query: {} };
      const res = makeRes();
      const mockLimit = jest.fn().mockResolvedValue([1]);
      Product.find.mockReturnValue({ limit: mockLimit });

      await getAllProducts(req, res);

      expect(Product.find).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not call res.json before awaiting products', async () => {
      const req = { query: { limit: 2 } };
      const res = makeRes();
      let resolver;
      const pending = new Promise((resolve) => { resolver = resolve; });
      const mockLimit = jest.fn().mockReturnValue(pending);
      Product.find.mockReturnValue({ limit: mockLimit });

      const promise = getAllProducts(req, res);
      expect(res.json).not.toHaveBeenCalled();
      resolver(['p1', 'p2']);
      await promise;
      expect(res.json).toHaveBeenCalledWith({ msg: 'Products fetched', data: ['p1', 'p2'] });
    });

    it('should log error and respond 500 when limit promise rejects', async () => {
      const req = { query: { limit: 3 } };
      const res = makeRes();
      const mockError = new Error('boom');
      const mockLimit = jest.fn().mockRejectedValue(mockError);
      Product.find.mockReturnValue({ limit: mockLimit });

      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await getAllProducts(req, res);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Server Error' });
    });
  });
});
