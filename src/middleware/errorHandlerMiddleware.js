const errorHandler = (error, request, reply) => {
    const statusCode = error.statusCode || 500;

    request.log.error({
        error: error.message,
        stack: error.stack,
        validation: error.validation || null,
    }, 'An error occurred');
    
    reply.status(statusCode).send({
        error: true,
        message: error.message || 'Internal Server Error',
        statusCode,
        details: error.validation || null,
    });
};

module.exports = errorHandler;