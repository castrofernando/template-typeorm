// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);
    const balanceRepository = getCustomRepository(TransactionRepository);
    const balance = await balanceRepository.getBalance();

    if (Number(balance.total) < Number(value) && type === 'outcome') {
      throw new AppError('insufficient founds');
    }

    const categoryDatabase = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryDatabase) {
      const categoryInserted = categoryRepository.create({
        title: category,
      });
      const category_id = await categoryRepository.save(categoryInserted);

      let transaction = transactionRepository.create({
        title,
        category_id: category_id.id,
        value,
        type,
      });
      transaction = await transactionRepository.save(transaction);
      return transaction;
    }
    let transaction = transactionRepository.create({
      title,
      category_id: categoryDatabase.id,
      value,
      type,
    });
    transaction = await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
