import { GAS_SETTINGS } from './constants';

export const sendTransaction = async (tx, options = {}) => {
    const gasPrice = await tx.provider.getGasPrice();
    const adjustedGasPrice = gasPrice.mul(GAS_SETTINGS.GAS_PRICE_MULTIPLIER);

    const finalGasPrice = adjustedGasPrice.gt(GAS_SETTINGS.MAX_GAS_PRICE)
        ? GAS_SETTINGS.MAX_GAS_PRICE
        : adjustedGasPrice;

    const transaction = await tx.send({
        gasPrice: finalGasPrice,
        gasLimit: options.gasLimit || GAS_SETTINGS.DEFAULT_GAS_LIMIT,
        ...options
    });

    return transaction.wait();
}; 