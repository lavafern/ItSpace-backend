// const {prisma} = require('../../libs/prismaClient');
const request = require('supertest');
const {app} = require('../../serverConfig');
/* globals describe, expect, test */ 


describe('test POST /auth/login endpoint',() => {
    test('Login berhasil', async () => {
        const {statusCode, body} = await request(app).post('/api/v1/auth/login').send({
            email : 'rian.rafli@gmail.com',
            password : '12345678'
        });

        expect(statusCode).toBe(200);
        expect(body).toHaveProperty('success');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('data');
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('id');
        expect(body.data).toHaveProperty('email');
        expect(body.data).toHaveProperty('profile');
        expect(body.data.profile).toHaveProperty('role');

    });
    test('Salah password', async () => {
        const {statusCode, body} = await request(app).post('/api/v1/auth/login').send({
            email : 'rian.rafli@gmail.com',
            password : '12345677'
        });

        expect(statusCode).toBe(401);
        expect(body).toHaveProperty('success');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('data');
        expect(body.success).toBe(false);
        expect(body.data).toBe(null);
    });
});