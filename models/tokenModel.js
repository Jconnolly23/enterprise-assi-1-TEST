const restdb = require('./db');

const tokenService = {
    async saveRefreshToken(username, refreshToken) {
        try {
            const response = await restdb.post('/tokens', { user: username, token: refreshToken });
            return response.data;
        } catch (error) {
            console.error('Error saving refresh token:', error);
            return null;
        }
    },
    // Get a refresh token
    async getRefreshToken(refreshToken) {
        try {
            const response = await restdb.get(`/tokens?q={"token":"${refreshToken}"}`);
            return response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            console.error('Error retrieving refresh token:', error);
            return null;
        }
    },
    // Delete a refresh token (on logout)
    async deleteRefreshToken(refreshToken) {
        try {
            const tokenEntry = await getRefreshToken(refreshToken);
            if (tokenEntry) {
                await restdb.delete(`/tokens/${tokenEntry._id}`);
            }
        } catch (error) {
            console.error('Error deleting refresh token:', error);
        }
    }
}
    
module.exports = tokenService;