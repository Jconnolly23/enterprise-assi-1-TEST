const restdb = require('./db');

const loanRecordsService = {
    async getRecordsForUser(username) {
        try {
            const response = await restdb.get(`/loan-records?q={"username":"${username}"}`);
            return response.data.length > 0 ? response.data : null;
        } catch (error) {
            console.error('Error retrieving loan records: ', error);
            return null;
        }
    },
    async saveLoanRecord(username, bookTitle, bookAuthor, loanDate, dueDate) {
        let newLoanRecordId;
        try {
            const response = await restdb.post('/loan-records', { 
                'username': username, 
                'book_title': bookTitle,
                'book_author': bookAuthor,
                'loan_date': loanDate,
                'due_date': dueDate 
            });
            console.log(`Loan-Records collection updated: `, response.data);
            newLoanRecordId = response.data._id;
        } catch (error) {
            console.error('Error saving loan record', error);
            return null;
        }
        return await this.getLoanRecord(newLoanRecordId);
    },
    async updateLoanRecordReturnedDate(id, returnedDate) {
        let updatedLoanRecordId;
        try {
            const response = await restdb.patch(`/loan-records/${id}`, { 'returned_date': returnedDate });
            console.log('Loan-Records collection updated: ', response.data);
            updatedLoanRecordId = response.data._id;
        } catch (error) {
            console.error('Error updating loan record', error);
            return null;
        }
        return await this.getLoanRecord(updatedLoanRecordId);
    },
    async getLoanRecord(id) {
        try {
            const response = await restdb.get(`/loan-records/${id}`);
            return response.data || null;
        } catch (error) {
            console.error('Error fetching user data:');
            return null;
        }
    },
}

module.exports = loanRecordsService;