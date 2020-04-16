import { Router } from 'express';
import { getRepository, getCustomRepository } from 'typeorm';
import multer from 'multer';
import CreateTransactionService from '../services/CreateTransactionService';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import DeleteTransactionService from '../services/DeleteTransactionService';
import uploadConfig from '../config/upload';
import ImportTransactionsService from '../services/ImportTransactionsService';
import Category from '../models/Category';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

interface TransactionResponse {
  id: string;
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: Category;
}
transactionsRouter.get('/', async (request, response) => {
  const balanceRepository = getCustomRepository(TransactionsRepository);
  const balance = await balanceRepository.getBalance();

  const transactionRepository = getRepository(Transaction);
  const transactions = await transactionRepository.find({
    relations: ['category'],
  });
  const transactionRegisters: TransactionResponse[] = [];
  transactions.forEach(transaction => {
    const transactionObject = transaction;
    delete transactionObject.created_at;
    delete transactionObject.updated_at;
    delete transactionObject.category.created_at;
    delete transactionObject.category.updated_at;

    transactionRegisters.push({
      id: transactionObject.id,
      title: transactionObject.title,
      type: transactionObject.type,
      value: Number(transactionObject.value),
      category: transactionObject.category,
    });
  });

  return response.json({ transactions: transactionRegisters, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;
  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category,
  });
  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute(id);
  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { filename } = request.file;
    console.log(request.file);
    const importTransaction = new ImportTransactionsService();
    const transactions = await importTransaction.execute(filename);
    return response.json(transactions);
  },
);

export default transactionsRouter;
