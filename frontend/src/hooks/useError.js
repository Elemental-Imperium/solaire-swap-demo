import { useState, useCallback } from 'react';
import { ERROR_MESSAGES } from '../utils/constants';

export const useError = () => {
    const [error, setError] = useState(null);

    const handleError = useCallback((error) => {
        console.error(error);
        if (error.code === 4001) {
            setError('Transaction rejected by user');
        } else if (error.code === -32603) {
            setError('Internal JSON-RPC error');
        } else {
            setError(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
        }
    }, []);

    return { error, setError, handleError };
}; 