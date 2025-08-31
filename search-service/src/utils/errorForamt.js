class ApiError extends Error {
    constructor({
        message = 'Something went wrong',
        status = 500,
        error = [],
        stack = ''
    } = {}) {
        super(message);
        this.message = message;
        this.statusCode = status;
        this.error = error;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = { ApiError };