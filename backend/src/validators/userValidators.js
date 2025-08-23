// PATH: backend/src/validators/userValidators.js
import { body, validationResult } from 'express-validator';

export const validateAIPreferences = [
  body('aiPreferences.tone')
    .optional()
    .isIn(['concise', 'detailed', 'educational', 'friendly'])
    .withMessage('Invalid tone value'),
  
  body('aiPreferences.detailLevel')
    .optional()
    .isIn(['minimal', 'moderate', 'comprehensive'])
    .withMessage('Invalid detail level'),
  
  body('aiPreferences.language')
    .optional()
    .isIn(['fr', 'en', 'es', 'de'])
    .withMessage('Invalid language'),
  
  body('aiPreferences.foodRestrictions')
    .optional()
    .isArray()
    .withMessage('Food restrictions must be an array'),
  
  body('aiPreferences.foodRestrictions.*')
    .isIn(['vegan', 'vegetarian', 'gluten-free', 'lactose-free', 'halal', 'kosher', 'low-sodium', 'diabetic'])
    .withMessage('Invalid food restriction'),
  
  body('aiPreferences.allergens')
    .optional()
    .isArray()
    .withMessage('Allergens must be an array'),
  
  body('aiPreferences.allergens.*')
    .isIn(['peanuts', 'tree-nuts', 'milk', 'eggs', 'wheat', 'soy', 'fish', 'shellfish', 'sesame'])
    .withMessage('Invalid allergen'),
  
  body('aiPreferences.cosmeticPreferences.skinType')
    .optional()
    .isIn(['normal', 'dry', 'oily', 'combination', 'sensitive'])
    .withMessage('Invalid skin type'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        statusCode: 400
      });
    }
    next();
  }
];