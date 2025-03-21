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
        try {
            const response = await restdb.post('/loan-records', { 
                'user': username, 
                'book_title': bookTitle,
                'book_author': bookAuthor,
                'loan_date': loanDate,
                'due_date': dueDate 
            });
            return response.data;
        } catch (error) {
            console.error('Error saving loan record', error);
            return null;
        }
    },
    async updateLoanRecordReturnedDate(id, returnedDate) {
        try {
            const response = await restdb.patch(`/loan-records/${id}`, { 'returned_date': returnedDate });
            return response.data;
        } catch (error) {
            console.error('Error updating loan record', error);
            return null;
        }
    }
}