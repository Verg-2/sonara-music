process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
process.env.MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

jest.setTimeout(30000);
