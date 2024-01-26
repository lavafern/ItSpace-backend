const { UnauthorizedError } = require('../../errors/customErrors.js');
const {generateOtp,decodeToken,signToken} = require('../../utils/authUtils.js');
/* globals describe, expect, test */ 

describe('generateOtp()',() => {
    test('length is 6', () => {
        const result = generateOtp();
        expect(result.length).toBe(6);
    });

    test('type data is string of numbers', () => {
        const result = generateOtp();
        expect((isNaN(Number(result)))).toBe(false);
        
    });
});


describe('decodeToken()',() => {
    test('throw error', async () => {
        await expect( decodeToken('w','w')).rejects.toThrow(UnauthorizedError);
    });

});

describe('signToken()',() => {
    test('return token', async () => {
        await expect( signToken('access',{id:1,name:'tes'},'secret')).resolves.toBeTruthy();
    });

});
