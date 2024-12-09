import { body } from 'express-validator';

export const uploadKycDocumentValidation = [
  body('docType').notEmpty().withMessage('Document type is required'),
  body('userId').notEmpty().withMessage('UserId is required'),
  body('viewType').notEmpty().withMessage('Document view type is required'),
  body('docName').notEmpty().withMessage('Document name is required')
];
