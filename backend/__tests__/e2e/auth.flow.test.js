const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const User = require('../../models/User');

describe('Auth flow (e2e)', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: 'music_test'
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should login and access /me', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'kadiraltundag145@gmail.com',
      password: 'Test1234',
      isVerified: true
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kadiraltundag145@gmail.com', password: 'Test1234' })
      .expect(200);

    expect(loginRes.body).toMatchObject({ success: true });
    expect(loginRes.body.token).toBeTruthy();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .expect(200);

    expect(meRes.body).toMatchObject({ success: true });
    expect(meRes.body.data.email).toBe(user.email);
  });
});
