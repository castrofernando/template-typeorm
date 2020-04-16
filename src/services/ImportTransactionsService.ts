import multer from 'multer';
import path from 'path';
import { getRepository } from 'typeorm';
import csvtojson from 'csvtojson';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';

import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    console.log(filename);

    const csvPath = path.join(uploadConfig.directory, filename);

    const transactions = await csvtojson().fromFile(csvPath);
    // console.log(transactions);

    const transactionRepository = getRepository(Transaction);

    for (const transaction of transactions) {
      console.log(transaction.category);
      const categoryRepository = getRepository(Category);
      let category = await categoryRepository.findOne({
        where: { title: transaction.category },
        cache: false,
      });
      if (!category) {
        category = categoryRepository.create({
          title: transaction.category,
        });
        category = await categoryRepository.save(category);
      }

      const transactionObject = transactionRepository.create({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id: category.id,
      });
      await transactionRepository.save(transactionObject);
    }
    return transactions;
  }
}

export default ImportTransactionsService;
