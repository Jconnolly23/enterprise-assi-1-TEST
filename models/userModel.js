const restdb = require('./db');
const bcrypt = require('bcryptjs');

const userService = {
    async findUserByUsername(username) { // searches for a user in the logins collection in the database
        try {
            const response = await restdb.get(`/logins?q={"username":"${username}"}`);
            const user = response.data[0];
            console.log(user);
            return user || null;
        } catch (error) {
            console.error('Error fetching user data:');
            throw error;
        }
    },
    async createNewUser(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userDetails = {
            username,
            password: hashedPassword
        };
        try {
            const postResponse = await restdb.post("/logins", userDetails);
            console.log(`Logins collection updated: `, postResponse.data);
        } catch (error) {
            console.error('Error updating database:', error);
            throw error; 
        }
        return await this.findUserByUsername(username);
    }
}

module.exports = userService;