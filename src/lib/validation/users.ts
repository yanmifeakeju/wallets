import Joi from 'joi';
import { UserData } from '../lib';

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

export default function validate(data: UserData) {
  const validationResult = userSchema.validate(data, { abortEarly: false });

  if (validationResult.error) {
    return {
      error: validationResult.error.details[0].message
    };
  }

  return null;
}
