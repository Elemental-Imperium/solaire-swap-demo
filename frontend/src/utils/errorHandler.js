import { ERROR_MESSAGES } from './constants';

export class TransactionError extends Error {
    constructor(message, code, transaction) {
        super(message);
        this.name = 'TransactionError';
        this.code = code;
        this.transaction = transaction;
    }
}

export function handleError(error) {
    console.error('Error details:', error);

    // MetaMask errors
    if (error.code === 4001) {
        return ERROR_MESSAGES.USER_REJECTED;
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR') {
        return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Contract errors
    if (error.code === 'CALL_EXCEPTION') {
        const reason = error.reason || error.message;
        return `Transaction failed: ${reason}`;
    }

    // Gas errors
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return ERROR_MESSAGES.GAS_ESTIMATE_FAILED;
    }

    // Generic fallback
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export async function executeWithRetry(
    operation,
    maxRetries = 3,
    delayMs = 1000
) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isRetryableError(error)) {
                throw error;
            }
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
            }
        }
    }

    throw lastError;
}

function isRetryableError(error) {
    return (
        error.code === 'NETWORK_ERROR' ||
        error.code === -32005 || // Rate limiting
        error.message.includes('timeout')
    );
} 