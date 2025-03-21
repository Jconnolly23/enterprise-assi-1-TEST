const restdb = require('./db');
const bcrypt = require('bcryptjs');

const userService = {
    async findUserByUsername(username) { // searches for a user in the logins collection in the database
        try {
            const response = await restdb.get(`/logins?q={"username":"${username}"}`);
            return response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            console.error('Error fetching user data:');
            return null;
        }
    },
    async createNewUser(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userDetails = {
            username,
            password: hashedPassword
        };
        try {
            const response = await restdb.post("/logins", userDetails);
            console.log(`Logins collection updated: `, response.data);
        } catch (error) {
            console.error('Error updating database:', error);
            return null; 
        }
        return await this.findUserByUsername(username);
    }
}

module.exports = userService;