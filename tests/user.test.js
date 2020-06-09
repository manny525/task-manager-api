const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {userOneId, userOne, setupDatabase} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Manthan',
        email: 'manny525@gmail.com',
        password: 'manny525'
    }).expect(201)

    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    expect(response.body).toMatchObject({
        user: {
            name: 'Manthan',
            email: 'manny525@gmail.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('manny525')
})

test('Should not sign up an existing user', async () => {
    await request(app).post('/users').send({
        ...userOne
    }).expect(400)
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(response.body).toMatchObject({
        token: user.tokens[1].token
    })
})

test('Should not login non-existent user', async () => {
    await request(app).post('/users/login').send({
        email: 'manny@gmail.com',
        password: userOne.password
    }).expect(400)
})

test('Should get profile for authenticated user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for authenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()   
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid authenticated user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Manny'
        })
        .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('Manny')
})

test('Should not update valid unauthenticated user fields', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: 'Manny'
        })
        .expect(401)
})

test('Should not update valid authenticated user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            lastName: 'Tolia'
        })
        .expect(400)
})